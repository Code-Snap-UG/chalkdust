import { getClassGroup } from "@/lib/actions/class-groups";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function ClassLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classGroup = await getClassGroup(id);

  if (!classGroup) notFound();

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/classes" className="hover:text-foreground transition-colors">
          Meine Klassen
        </Link>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">
          {classGroup.name} &ndash; {classGroup.subject}
        </span>
      </nav>
      {children}
    </div>
  );
}
