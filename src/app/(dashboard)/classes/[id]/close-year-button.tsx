import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

interface Props {
  classGroupId: string;
  isArchived?: boolean;
}

export function CloseYearButton({ classGroupId, isArchived }: Props) {
  if (isArchived) return null;

  return (
    <Button variant="outline" asChild>
      <Link href={`/classes/${classGroupId}/transition`}>
        <Archive className="mr-2 size-4" />
        Schuljahr abschließen
      </Link>
    </Button>
  );
}
