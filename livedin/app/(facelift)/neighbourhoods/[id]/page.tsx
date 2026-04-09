import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/** Placeholder dynamic route: no neighbourhood rows to hydrate yet. */
export default async function NeighbourhoodDetailPage({ params }: Props) {
  const { id } = await params;
  if (!id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1
        className="mb-4 text-3xl font-bold text-[#0F1F38]"
        style={{ fontFamily: "var(--font-lora), ui-serif, Georgia, serif" }}
      >
        Neighbourhood guide
      </h1>
      <p className="text-[#717182]">
        There is no public neighbourhood record for this slug yet. Browse active listings from
        search instead.
      </p>
      <Link
        href="/search"
        className="mt-8 inline-block rounded-[12px] bg-[#E8913A] px-6 py-3 font-semibold text-white"
      >
        Browse search
      </Link>
    </div>
  );
}
