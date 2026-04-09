import { useEffect, useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Terminal,
  ChevronRight,
  Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';

export default function Deployments() {
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // In a real app, we'd query by projects owned by user
    // For now, let's just show all deployments for simplicity in demo
    const q = query(
      collection(db, 'deployments'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDeployments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Mock data if empty
    if (deployments.length === 0) {
      setDeployments([
        { id: '1', projectName: 'ViteHost Landing', version: 'v1.2.4', status: 'live', createdAt: new Date(), branch: 'main' },
        { id: '2', projectName: 'Admin Dashboard', version: 'v0.8.2', status: 'building', createdAt: new Date(Date.now() - 1000 * 60 * 30), branch: 'develop' },
        { id: '3', projectName: 'API Service', version: 'v2.1.0', status: 'error', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), branch: 'main' },
        { id: '4', projectName: 'ViteHost Landing', version: 'v1.2.3', status: 'live', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), branch: 'main' },
      ]);
    }

    return () => unsubscribe();
  }, [user]);

  const filteredDeployments = deployments.filter(d => 
    d.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deployments</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Track and manage your project deployments.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            placeholder="Search deployments..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
              <TableHead className="w-[300px]">Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeployments.map((deployment) => (
              <TableRow key={deployment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zinc-400" />
                    {deployment.projectName}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {deployment.status === 'live' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {deployment.status === 'building' && <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />}
                    {deployment.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    <span className="capitalize">{deployment.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {deployment.version}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Terminal className="w-3 h-3" />
                    {deployment.branch}
                  </div>
                </TableCell>
                <TableCell className="text-zinc-500">
                  {deployment.createdAt instanceof Date 
                    ? formatDistanceToNow(deployment.createdAt) 
                    : formatDistanceToNow(deployment.createdAt.toDate())} ago
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
