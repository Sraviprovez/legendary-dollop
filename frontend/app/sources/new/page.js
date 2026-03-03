"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Upload, Database, HardDrive, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { PromptTooltip } from "@/components/shared/PromptTooltip";
import { useSourceStore } from "@/lib/store/sourceStore";
import { toast } from "sonner";

export default function NewSourcePage() {
  const router = useRouter();
  const { addSource } = useSourceStore();
  const [sourceType, setSourceType] = useState("csv");
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  
  const [formData, setFormData] = useState({
    csv: { file: null, s3Path: "" },
    mysql: { host: "", port: "3306", database: "", username: "", password: "", dbName: "" },
    postgresql: { host: "", port: "5432", database: "", username: "", password: "", dbName: "" },
    s3: { bucket: "", region: "us-east-1", prefix: "", accessKey: "", secretKey: "" }
  });

  const updateFormData = (type, field, value) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestStatus(null);
    
    setTimeout(() => {
      setIsTesting(false);
      const success = Math.random() < 0.8;
      setTestStatus(success ? 'success' : 'failure');
      
      if (success) {
        toast.success('Connection successful! ✅');
      } else {
        toast.error('Connection failed. Please check your credentials.');
      }
    }, 2000);
  };

  const handleCreate = () => {
    const sourceData = {
      name: sourceType === 'csv' 
        ? (formData.csv.file?.name || 'uploaded_file.csv') 
        : `${sourceType}_${formData[sourceType].database || formData[sourceType].bucket}`,
      type: sourceType,
      metadata: {
        ...formData[sourceType],
        sampling: {
          preview: "Sample data preview available"
        }
      }
    };
    
    addSource(sourceData);
    toast.success('Source created successfully!');
    router.push("/sources");
  };

  const renderTestButton = () => (
    <Button 
      variant="outline" 
      onClick={handleTestConnection}
      disabled={isTesting}
      className="relative"
    >
      {isTesting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        'Test Connection'
      )}
      {testStatus === 'success' && (
        <CheckCircle2 className="ml-2 h-4 w-4 text-green-500" />
      )}
      {testStatus === 'failure' && (
        <XCircle className="ml-2 h-4 w-4 text-red-500" />
      )}
    </Button>
  );

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
              <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                   onClick={() => document.getElementById('csv-file').click()}>
                <input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => updateFormData('csv', 'file', e.target.files[0])}
                />
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {formData.csv.file ? formData.csv.file.name : 'Drop your CSV file here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>
              
              <div className="space-y-2">
                <Label>Or provide S3 path</Label>
                <Input 
                  placeholder="s3://bucket-name/path/to/file.csv"
                  value={formData.csv.s3Path}
                  onChange={(e) => updateFormData('csv', 's3Path', e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="mysql" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input 
                    placeholder="mysql.corp.internal"
                    value={formData.mysql.host}
                    onChange={(e) => updateFormData('mysql', 'host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    placeholder="3306"
                    value={formData.mysql.port}
                    onChange={(e) => updateFormData('mysql', 'port', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input 
                    placeholder="customers"
                    value={formData.mysql.database}
                    onChange={(e) => updateFormData('mysql', 'database', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    placeholder="admin"
                    value={formData.mysql.username}
                    onChange={(e) => updateFormData('mysql', 'username', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.mysql.password}
                    onChange={(e) => updateFormData('mysql', 'password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input 
                    placeholder="my_database"
                    value={formData.mysql.dbName}
                    onChange={(e) => updateFormData('mysql', 'dbName', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="postgresql" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input 
                    placeholder="postgres.warehouse.internal"
                    value={formData.postgresql.host}
                    onChange={(e) => updateFormData('postgresql', 'host', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input 
                    placeholder="5432"
                    value={formData.postgresql.port}
                    onChange={(e) => updateFormData('postgresql', 'port', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database</Label>
                  <Input 
                    placeholder="inventory"
                    value={formData.postgresql.database}
                    onChange={(e) => updateFormData('postgresql', 'database', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input 
                    placeholder="admin"
                    value={formData.postgresql.username}
                    onChange={(e) => updateFormData('postgresql', 'username', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.postgresql.password}
                    onChange={(e) => updateFormData('postgresql', 'password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Database Name</Label>
                  <Input 
                    placeholder="my_database"
                    value={formData.postgresql.dbName}
                    onChange={(e) => updateFormData('postgresql', 'dbName', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="s3" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bucket Name</Label>
                  <Input 
                    placeholder="my-data-lake"
                    value={formData.s3.bucket}
                    onChange={(e) => updateFormData('s3', 'bucket', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Input 
                    placeholder="us-east-1"
                    value={formData.s3.region}
                    onChange={(e) => updateFormData('s3', 'region', e.target.value)}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Path/Prefix</Label>
                  <Input 
                    placeholder="raw/data/"
                    value={formData.s3.prefix}
                    onChange={(e) => updateFormData('s3', 'prefix', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Key</Label>
                  <Input 
                    placeholder="AKIAXXXXXXXXXXXX"
                    value={formData.s3.accessKey}
                    onChange={(e) => updateFormData('s3', 'accessKey', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={formData.s3.secretKey}
                    onChange={(e) => updateFormData('s3', 'secretKey', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <PromptTooltip content="After adding source, you'll see sample data and can start building transformations">
              <Button variant="outline">Need help?</Button>
            </PromptTooltip>
            {sourceType !== 'csv' && renderTestButton()}
          </div>
          <Button onClick={handleCreate}>Create Source</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
