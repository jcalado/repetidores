import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Radio } from "lucide-react";

export default function RepeaterNotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Radio className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Repetidor não encontrado</h1>
          <p className="text-muted-foreground">
            O repetidor que procura não existe ou foi removido da base de dados.
          </p>
        </div>
        <Button asChild>
          <Link href="/#tabela">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à lista de repetidores
          </Link>
        </Button>
      </div>
    </main>
  );
}
