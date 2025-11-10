import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, MessageSquare, Trash2, Send, Database, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const [documents, setDocuments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [collection, setCollection] = useState("default");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState("all");

  useEffect(() => {
    fetchDocuments();
    fetchCollections();
    // Generate session ID
    setSessionId(`session_${Date.now()}`);
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await axios.get(`${API}/collections`);
      setCollections(response.data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [".pdf", ".docx", ".txt"];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!allowedTypes.includes(fileExt)) {
        toast.error("Only PDF, DOCX, and TXT files are supported");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("collection", collection);

      const response = await axios.post(`${API}/documents/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      toast.success(`${response.data.filename} uploaded successfully! (${response.data.chunks} chunks indexed)`);
      setSelectedFile(null);
      setCollection("default");
      fetchDocuments();
      fetchCollections();
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error(error.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API}/documents/${documentId}`);
      toast.success("Document deleted successfully");
      fetchDocuments();
      fetchCollections();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleSendMessage = async () => {
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setChatLoading(true);

    try {
      const response = await axios.post(`${API}/chat`, {
        query: query,
        collection: selectedCollection === "all" ? null : selectedCollection,
        session_id: sessionId
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.answer,
        sources: response.data.sources
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error.response?.data?.detail || "Failed to get response");
      // Remove user message if error occurred
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId(`session_${Date.now()}`);
    toast.success("Chat cleared");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-slate-800 via-blue-700 to-teal-700 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Local RAG-SLM
          </h1>
          <p className="text-base text-slate-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Document Intelligence with Qwen 3 8B • Fully Local & Private
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="chat" data-testid="chat-tab">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="documents" data-testid="documents-tab">
              <Database className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="backdrop-blur-sm bg-white/80 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ask Questions</span>
                  {collections.length > 0 && (
                    <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                      <SelectTrigger className="w-[180px]" data-testid="collection-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Collections</SelectItem>
                        {collections.map(coll => (
                          <SelectItem key={coll} value={coll}>{coll}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardTitle>
                <CardDescription>
                  Query your documents using natural language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full pr-4 mb-4" data-testid="chat-messages">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                      <p className="text-sm">Upload documents and start asking questions</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, idx) => (
                        <div
                          key={idx}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          data-testid={`message-${message.role}-${idx}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-3 ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-300">
                                <p className="text-xs font-semibold mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.map((source, sidx) => (
                                    <Badge key={sidx} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 rounded-lg px-4 py-3">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question about your documents..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={chatLoading || documents.length === 0}
                    data-testid="chat-input"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={chatLoading || !query.trim() || documents.length === 0}
                    data-testid="send-button"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  {messages.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleClearChat}
                      data-testid="clear-chat-button"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {/* Upload Section */}
            <Card className="backdrop-blur-sm bg-white/80 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </CardTitle>
                <CardDescription>
                  Upload PDF, DOCX, or TXT files to index them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                    disabled={uploading}
                    data-testid="file-upload-input"
                  />
                  {selectedFile && (
                    <p className="text-sm text-slate-600 mt-2" data-testid="selected-file-name">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="collection">Collection</Label>
                  <Input
                    id="collection"
                    placeholder="default"
                    value={collection}
                    onChange={(e) => setCollection(e.target.value)}
                    disabled={uploading}
                    data-testid="collection-input"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Group documents by category (e.g., safety_manual, operations)
                  </p>
                </div>

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="w-full"
                  data-testid="upload-button"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Index
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Documents List */}
            <Card className="backdrop-blur-sm bg-white/80 border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Indexed Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] w-full pr-4">
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          data-testid={`document-item-${doc.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm text-slate-900">{doc.filename}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {doc.collection}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            data-testid={`delete-document-${doc.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;