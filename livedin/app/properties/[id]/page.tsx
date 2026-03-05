import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyStubPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl">
        <p className="text-zinc-600 dark:text-zinc-400">Property detail (Slice 02)</p>
        <h1 className="mt-2 text-xl font-semibold">Property {id}</h1>
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
