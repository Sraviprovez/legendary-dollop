"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Database, HardDrive } from "lucide-react";
import Link from "next/link";
import { PromptTooltip } from "@/components/shared/PromptTooltip";

export default function NewSourcePage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("csv");

  const handleCreate = () => {
    router.push("/sources");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sources">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Data Source</h1>
          <p className="text-muted-foreground">Connect a new data source to SynKrasis.ai</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Source Type</CardTitle>
          <CardDescription>Choose the type of data source you want to connect</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="csv" onValueChange={setSourceType}>
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="csv" className="space-x-2">
                <Upload className="h-4 w-4" />
                <span>CSV</span>
              </TabsTrigger>
              <TabsTrigger value="mysql" className="space-x-2">
                <Database className="h-4 w-4" />
                <span>MySQL</span>
              </TabsTrigger>
              <TabsTrigger value="postgresql" className="space-x-2">
                <Database className="h-4 w-4" />
                <span>PostgreSQL</span>
              </TabsTrigger>
              <TabsTrigger value="s3" className="space-x-2">
                <HardDrive className="h-4 w-4" />
                <span>S3</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="csv" className="space-y-4 mt-6">
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>
              
              <div className="space-y-2">
                <Label>Or provide S3 path</Label>
                <Input placeholder="s3://bucket-name/path/to/file.csv" />
              </div>
            </TabsContent>

            <TabsContent value="mysql" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input placeholder="mysql.corp.internal" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input placeholder="3306" />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input placeholder="customers" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input placeholder="my_database" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="postgresql" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input placeholder="postgres.warehouse.internal" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input placeholder="5432" />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input placeholder="inventory" />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input placeholder="admin" />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input placeholder="my_database" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="s3" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bucket Name</Label>
                  <Input placeholder="my-data-lake" />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input placeholder="us-east-1" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Path/Prefix</Label>
                  <Input placeholder="raw/data/" />
                </div>
                <div className="space-y-2">
                  <Label>Access Key</Label>
                  <Input placeholder="AKIAXXXXXXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <PromptTooltip content="After adding source, you'll see sample data and can start building transformations">
            <Button variant="outline">Need help?</Button>
          </PromptTooltip>
          <Button onClick={handleCreate}>Create Source</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
