import { promises as fs } from 'fs';
import path from 'path';
import { Repeater } from "./columns";
import RepeaterBrowser from "@/components/RepeaterBrowser";

async function getData(): Promise<Repeater[]> {
  const data = await fs.readFile(
    path.join(process.cwd(), 'src/repeaters.json')
  );
  return JSON.parse(data.toString());
}

export default async function Home() {
  const data = await getData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 sm:p-8 md:p-12 lg:p-24">
      <RepeaterBrowser data={data} />
    </main>
  );
}
