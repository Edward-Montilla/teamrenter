import Link from "next/link";

export default function PropertyNotFound() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold">Property not found</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          This property does not exist or is no longer available.
        </p>
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
