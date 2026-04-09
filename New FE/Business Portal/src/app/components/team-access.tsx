import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { teamMembers as initialMembers } from "../data/mock-data";

export function TeamAccess() {
  const [members, setMembers] = useState(initialMembers);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge className="bg-[#0f1f3a] text-white">Admin</Badge>;
      case "Regional Manager":
        return <Badge className="bg-[#3b5580] text-white">Regional Manager</Badge>;
      case "Leasing Agent":
        return <Badge variant="outline">Leasing Agent</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getAccessBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case "Full":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Full Access</Badge>;
      case "Read-only":
        return <Badge variant="outline">Read-only</Badge>;
      default:
        return <Badge variant="outline">{accessLevel}</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Team Access Control
          </h1>
          <p className="text-muted-foreground">
            Manage staff permissions and access levels
          </p>
        </div>
        <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-[#0a1628] gap-2">
          <UserPlus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{getAccessBadge(member.accessLevel)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#0f1f3a] text-white">Admin</Badge>
                <span className="font-medium">Full Access</span>
              </div>
              <p className="text-sm text-muted-foreground pl-20">
                Can manage all properties, team members, and system settings
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#3b5580] text-white">Regional Manager</Badge>
                <span className="font-medium">Full or Read-only</span>
              </div>
              <p className="text-sm text-muted-foreground pl-32">
                Can manage assigned properties and view analytics
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Leasing Agent</Badge>
                <span className="font-medium">Read-only</span>
              </div>
              <p className="text-sm text-muted-foreground pl-32">
                Can view property information and reviews
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
