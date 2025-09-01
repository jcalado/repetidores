import { promises as fs } from 'fs';
import path from 'path';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { columns, Repeater } from "./columns";
import MapClient from "@/components/MapClient";

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
      <Card className="w-full max-w-7xl">
        <CardHeader>
          <CardTitle>Ham Radio Repeaters</CardTitle>
          <CardDescription>
            A list of ham radio repeaters in Spain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table">
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <DataTable columns={columns} data={data} />
            </TabsContent>
            <TabsContent value="map" className="h-[500px]">
              <MapClient />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}