import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink, 
  Settings, 
  Trash2,
  Globe,
  Clock,
  Zap,
  Upload,
  FileCode,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../components/ui/dialog';
import { toast } from 'sonner';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [user]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    if (files.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    setIsUploading(true);
    try {
      const subdomain = newProjectName.toLowerCase().replace(/\s+/g, '-');
      const baseDomain = window.location.host;
      
      // 1. Create project doc
      const projectRef = await addDoc(collection(db, 'projects'), {
        name: newProjectName,
        description: newProjectDesc,
        ownerId: user?.uid,
        status: 'building',
        subdomain,
        baseDomain,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 2. Create deployment doc
      const deploymentRef = await addDoc(collection(db, `projects/${projectRef.id}/deployments`), {
        projectId: projectRef.id,
        version: 'v1.0.0',
        status: 'building',
        filesCount: files.length,
        createdAt: serverTimestamp(),
      });

      // 3. Upload files (simulation)
      for (const file of files) {
        const fileRef = ref(storage, `projects/${projectRef.id}/deployments/${deploymentRef.id}/${file.name}`);
        await uploadBytes(fileRef, file);
      }

      // 4. Update status to live
      // In a real app, this would be done by a cloud function after build
      await addDoc(collection(db, 'deployments'), {
        projectId: projectRef.id,
        projectName: newProjectName,
        version: 'v1.0.0',
        status: 'live',
        branch: 'main',
        createdAt: serverTimestamp(),
      });

      // Update project status
      // Note: In a real app, we'd use a transaction or cloud function
      // For this demo, we'll just update it directly
      // But since we are listening to the collection, it will update the UI
      
      setIsCreateModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setFiles([]);
      toast.success('Project deployed successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to deploy project.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'projects', projectToDelete));
      toast.success('Project deleted.');
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (error) {
      toast.error('Failed to delete project.');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage and deploy your web applications.</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger render={
            <Button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          } />
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Enter a name and upload your static files to deploy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Name</label>
                <Input 
                  placeholder="my-awesome-app" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input 
                  placeholder="A brief description of your project" 
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Files</label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    files.length > 0 ? 'border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800/50' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  <input 
                    type="file" 
                    multiple 
                    className="hidden" 
                    id="file-upload" 
                    onChange={onFileChange}
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {files.length > 0 ? (
                      <>
                        <FileCode className="w-8 h-8 text-zinc-900 dark:text-white" />
                        <span className="text-sm font-medium">{files.length} files selected</span>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setFiles([]); }} className="h-7 text-xs">
                          Clear
                        </Button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-zinc-400" />
                        <span className="text-sm font-medium">Click to upload or drag and drop</span>
                        <span className="text-xs text-zinc-500">HTML, CSS, JS, Images</span>
                      </>
                    )}
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="max-h-[100px] overflow-y-auto space-y-1 mt-2">
                    {files.slice(0, 5).map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 p-2 rounded">
                        <span className="truncate">{file.name}</span>
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ))}
                    {files.length > 5 && (
                      <p className="text-[10px] text-center text-zinc-400">and {files.length - 5} more files...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isUploading}>Cancel</Button>
              <Button onClick={handleCreateProject} disabled={isUploading || !newProjectName}>
                {isUploading ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Project'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>

        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card 
            key={project.id} 
            className="group hover:scale-[1.02] transition-all duration-300 glass cursor-pointer overflow-hidden relative"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-vibrant-blue/5 blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-vibrant-blue/10 transition-colors" />
            
            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-vibrant-blue/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-vibrant-blue" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem className="gap-2">
                        <Settings className="w-4 h-4" /> Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Zap className="w-4 h-4" /> Deployments
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-red-600 dark:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(project.id);
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="mt-4 flex items-center gap-2">
                {project.name}
                <Badge variant={project.status === 'live' ? 'default' : 'secondary'} className={
                  project.status === 'live' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                }>
                  {project.status}
                </Badge>
              </CardTitle>
              <CardDescription className="line-clamp-2 min-h-[40px]">
                {project.description || 'No description provided.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subdomain</span>
                  <span className="font-medium text-vibrant-blue">{project.subdomain}.{project.baseDomain || 'vitehost.app'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Last Deployed</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.createdAt ? formatDistanceToNow(project.createdAt.toDate()) : 'Just now'} ago
                  </span>
                </div>
                <div className="pt-4 flex gap-2">
                  <Button variant="outline" nativeButton={false} className="flex-1 gap-2 glass border-zinc-200 dark:border-zinc-800 hover:bg-vibrant-blue/5" render={
                    <a href={`https://${project.subdomain}.${project.baseDomain || 'vitehost.app'}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      <ExternalLink className="w-4 h-4" />
                      Visit
                    </a>
                  } />
                  <Button className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 group-hover:bg-vibrant-gradient group-hover:border-transparent transition-all">Manage</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProjects.length === 0 && searchQuery && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            No projects found matching "{searchQuery}"
          </div>
        )}
      </div>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the project
              and remove all associated deployments from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProject}>Delete Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
