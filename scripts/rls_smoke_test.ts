import { createClient, SupabaseClient } from '@supabase/supabase-js';

type TestFn = () => Promise<void>;

async function runTest(name: string, fn: TestFn) {
  try {
    await fn();
    // eslint-disable-next-line no-console
    console.log(`PASS - ${name}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`FAIL - ${name}`);
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  }
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function createAnonClient(): SupabaseClient {
  const url = getEnv('SUPABASE_URL');
  const anonKey = getEnv('SUPABASE_ANON_KEY');
  return createClient(url, anonKey);
}

async function signIn(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<void> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`signIn failed for ${email}: ${error.message}`);
  }
}

async function main() {
  const seedPassword = process.env.SUPABASE_SEED_PASSWORD ?? 'seedpassword';

  // ---------------------------------------------------------------------------
  // 1) Anon client tests
  // ---------------------------------------------------------------------------
  const anon = createAnonClient();

  await runTest('Anon: SELECT active properties', async () => {
    const { data, error } = await anon
      .from('properties')
      .select('*')
      .order('id');

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Expected some properties rows for anon');
    }

    const inactive = data.filter((row: any) => row.status !== 'active');
    if (inactive.length > 0) {
      throw new Error('Anon should only see properties with status=active');
    }
  });

  await runTest('Anon: SELECT property_aggregates only for active properties', async () => {
    const { data, error } = await anon
      .from('property_aggregates')
      .select('property_id');

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Expected some property_aggregates rows for anon');
    }

    // For each aggregate row, ensure its property is active
    for (const row of data as Array<{ property_id: string }>) {
      const { data: propRows, error: propError } = await anon
        .from('properties')
        .select('status')
        .eq('id', row.property_id)
        .maybeSingle();

      if (propError) {
        throw propError;
      }
      if (!propRows || propRows.status !== 'active') {
        throw new Error(
          `Anon should not see aggregates for inactive property ${row.property_id}`,
        );
      }
    }
  });

  await runTest(
    'Anon: SELECT distilled_insights only approved for active properties',
    async () => {
      const { data, error } = await anon
        .from('distilled_insights')
        .select('property_id, status');

      if (error) {
        throw error;
      }

      if (!data) {
        // It is acceptable for anon to see zero rows if nothing is approved yet.
        return;
      }

      for (const row of data as Array<{ property_id: string; status: string }>) {
        if (row.status !== 'approved') {
          throw new Error(
            `Anon should only see distilled_insights with status=approved (got ${row.status})`,
          );
        }

        const { data: propRows, error: propError } = await anon
          .from('properties')
          .select('status')
          .eq('id', row.property_id)
          .maybeSingle();

        if (propError) {
          throw propError;
        }
        if (!propRows || propRows.status !== 'active') {
          throw new Error(
            `Anon should not see distilled_insights for inactive property ${row.property_id}`,
          );
        }
      }
    },
  );

  await runTest('Anon: SELECT reviews is denied', async () => {
    const { error } = await anon.from('reviews').select('id').limit(1);
    if (!error) {
      throw new Error('Anon SELECT on reviews should be denied by RLS');
    }
  });

  // ---------------------------------------------------------------------------
  // 2) Authenticated non-verified user (public@example.com)
  // ---------------------------------------------------------------------------
  const publicClient = createAnonClient();
  await signIn(publicClient, 'public@example.com', seedPassword);

  await runTest('Non-verified: INSERT review is denied', async () => {
    const {
      data: user,
      error: userError,
    } = await publicClient.auth.getUser();
    if (userError) throw userError;
    if (!user?.user) throw new Error('No auth user after sign-in (public)');

    const userId = user.user.id;

    const { error } = await publicClient.from('reviews').insert({
      property_id: 'a0000001-0001-4000-8000-000000000001',
      user_id: userId,
      status: 'pending',
      management_responsiveness: 3,
      maintenance_timeliness: 3,
      listing_accuracy: 3,
      fee_transparency: 3,
      lease_clarity: 3,
    });

    if (!error) {
      throw new Error(
        'Non-verified user should not be allowed to insert into reviews',
      );
    }
  });

  // ---------------------------------------------------------------------------
  // 3) Authenticated verified user (verified@example.com)
  // ---------------------------------------------------------------------------
  const verifiedClient = createAnonClient();
  await signIn(verifiedClient, 'verified@example.com', seedPassword);

  await runTest('Verified: INSERT review succeeds', async () => {
    const { data: user, error: userError } =
      await verifiedClient.auth.getUser();
    if (userError) throw userError;
    if (!user?.user) throw new Error('No auth user after sign-in (verified)');

    const userId = user.user.id;

    const { error } = await verifiedClient.from('reviews').insert({
      property_id: 'a0000004-0004-4000-8000-000000000004',
      user_id: userId,
      status: 'pending',
      management_responsiveness: 4,
      maintenance_timeliness: 4,
      listing_accuracy: 4,
      fee_transparency: 4,
      lease_clarity: 4,
      text_input: 'Test review from verified user',
    });

    if (error) {
      throw error;
    }
  });

  await runTest('Verified: SELECT own reviews (including text_input)', async () => {
    const { data: user, error: userError } =
      await verifiedClient.auth.getUser();
    if (userError) throw userError;
    if (!user?.user) throw new Error('No auth user after sign-in (verified)');

    const userId = user.user.id;

    const { data, error } = await verifiedClient
      .from('reviews')
      .select('id, user_id, text_input')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Verified user should see at least one own review');
    }
    if (data.some((row: any) => row.user_id !== userId)) {
      throw new Error('Verified user should only see their own reviews');
    }
  });

  await runTest(
    "Verified: cannot see someone else's reviews",
    async () => {
      const { data: user, error: userError } =
        await verifiedClient.auth.getUser();
      if (userError) throw userError;
      if (!user?.user) throw new Error('No auth user after sign-in (verified)');

      const userId = user.user.id;

      const { data, error } = await verifiedClient
        .from('reviews')
        .select('id, user_id')
        .neq('user_id', userId);

      if (error) {
        // A permission error here is acceptable and proves RLS is working.
        return;
      }

      if (data && data.length > 0) {
        throw new Error(
          'Verified user should not see reviews written by other users',
        );
      }
    },
  );

  // ---------------------------------------------------------------------------
  // 4) Admin session (admin@example.com)
  // ---------------------------------------------------------------------------
  const adminClient = createAnonClient();
  await signIn(adminClient, 'admin@example.com', seedPassword);

  await runTest('Admin: CRUD properties', async () => {
    // Create
    const { data: user, error: userError } = await adminClient.auth.getUser();
    if (userError) throw userError;
    if (!user?.user) throw new Error('No auth user after sign-in (admin)');

    const { data: inserted, error: insertError } = await adminClient
      .from('properties')
      .insert({
        display_name: 'RLS Test Property',
        address_line1: '123 Test St',
        city: 'Toronto',
        province: 'ON',
        postal_code: 'M5V 9ZZ',
        status: 'active',
        created_by: user.user.id,
      })
      .select('id')
      .maybeSingle();

    if (insertError) throw insertError;
    if (!inserted) throw new Error('Admin property insert returned no row');

    const propertyId = inserted.id as string;

    // Update
    const { error: updateError } = await adminClient
      .from('properties')
      .update({ status: 'inactive' })
      .eq('id', propertyId);
    if (updateError) throw updateError;

    // Delete
    const { error: deleteError } = await adminClient
      .from('properties')
      .delete()
      .eq('id', propertyId);
    if (deleteError) throw deleteError;
  });

  await runTest('Admin: SELECT and UPDATE reviews', async () => {
    const { data, error } = await adminClient
      .from('reviews')
      .select('id, text_input')
      .limit(1);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      // There should be at least the seeded reviews.
      throw new Error('Expected at least one review visible to admin');
    }

    const reviewId = data[0].id as string;
    const { error: updateError } = await adminClient
      .from('reviews')
      .update({ text_input: 'Admin moderated text.' })
      .eq('id', reviewId);

    if (updateError) {
      throw updateError;
    }
  });

  await runTest('Admin: INSERT into distilled_insights', async () => {
    const { error } = await adminClient.from('distilled_insights').upsert(
      {
        property_id: 'a0000001-0001-4000-8000-000000000001',
        insights_text: 'Admin-created insight for testing.',
        status: 'approved',
        screened: true,
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'property_id' },
    );

    if (error) {
      throw error;
    }
  });

  await runTest('Admin: INSERT into admin_audit_log', async () => {
    const { data: user, error: userError } = await adminClient.auth.getUser();
    if (userError) throw userError;
    if (!user?.user) throw new Error('No auth user after sign-in (admin)');

    const { error } = await adminClient.from('admin_audit_log').insert({
      admin_user_id: user.user.id,
      action_type: 'rls_smoke_test',
      target_type: 'none',
      target_id: null,
      details: { message: 'RLS smoke test entry' },
    });

    if (error) {
      throw error;
    }
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error running RLS smoke tests', err);
  process.exit(1);
});

