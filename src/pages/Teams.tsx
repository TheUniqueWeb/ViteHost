import { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  UserPlus, 
  Shield, 
  MoreHorizontal, 
  Mail,
  Settings,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function Teams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'teams'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Mock data if empty
    if (teams.length === 0) {
      setTeams([
        { 
          id: '1', 
          name: 'Frontend Team', 
          ownerId: user.uid, 
          membersCount: 4, 
          projectsCount: 2,
          members: [
            { name: 'John Doe', role: 'admin', avatar: '' },
            { name: 'Jane Smith', role: 'editor', avatar: '' },
            { name: 'Bob Wilson', role: 'viewer', avatar: '' },
          ]
        },
        { 
          id: '2', 
          name: 'Marketing', 
          ownerId: 'other', 
          membersCount: 12, 
          projectsCount: 5,
          members: [
            { name: 'Alice Brown', role: 'admin', avatar: '' },
          ]
        },
      ]);
    }

    return () => unsubscribe();
  }, [user]);

  const handleCreateTeam = async () => {
    toast.info('Team creation is coming soon!');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Collaborate with your team members on projects.</p>
        </div>
        <Button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" onClick={handleCreateTeam}>
          <Plus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2">
                      <Settings className="w-4 h-4" /> Team Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2">
                      <UserPlus className="w-4 h-4" /> Invite Member
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 text-red-600 dark:text-red-400">
                      <Trash2 className="w-4 h-4" /> Leave Team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardTitle className="mt-4">{team.name}</CardTitle>
              <CardDescription>
                {team.membersCount} members · {team.projectsCount} projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex -space-x-2 overflow-hidden">
                  {[1, 2, 3, 4].map((i) => (
                    <Avatar key={i} className="border-2 border-white dark:border-zinc-900 h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-zinc-100 dark:bg-zinc-800">
                        {String.fromCharCode(64 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 text-[10px] font-medium">
                    +{team.membersCount - 4 > 0 ? team.membersCount - 4 : 0}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Shield className="w-3 h-3" />
                    {team.ownerId === user?.uid ? 'Owner' : 'Member'}
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    View Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <button 
          onClick={handleCreateTeam}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-600 transition-all bg-zinc-50/50 dark:bg-zinc-900/50 group"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-zinc-400" />
          </div>
          <p className="font-medium">Create a new team</p>
          <p className="text-xs text-zinc-500 mt-1">Collaborate with others</p>
        </button>
      </div>
    </div>
  );
}

function DropdownMenuSeparator() {
  return <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />;
}
