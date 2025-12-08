import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"

export default function AssociationNotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Associacao nao encontrada</h1>
        <p className="text-muted-foreground mb-6">
          A associacao que procura nao existe ou foi removida.
        </p>
        <Button asChild>
          <Link href="/repetidores">Voltar aos Repetidores</Link>
        </Button>
      </div>
    </main>
  )
}
