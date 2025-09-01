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
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <RepeaterBrowser data={data} />
    </main>
  );
}
