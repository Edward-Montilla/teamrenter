import Link from "next/link";

type Props = {
  params: Promise<{ propertyId: string }>;
};

export default async function SubmitReviewStubPage({ params }: Props) {
  await params;
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl">
        <p className="text-zinc-600 dark:text-zinc-400">Review submission coming in Slice 03</p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm font-medium text-foreground underline hover:no-underline"
        >
          Back to results
        </Link>
      </div>
    </div>
  );
}
