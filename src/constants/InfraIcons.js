// Infra / architecture icon set for the icon library, reusing lucide-react
// (already a dependency, ISC-licensed) so there's no new asset licensing to
// track. Each entry is rendered in the picker and dropped onto the canvas as a
// fabric SVG group. Labels are diagram-flavoured (what the icon represents).
import {
  Server,
  Database,
  Cloud,
  HardDrive,
  Cpu,
  Container,
  Boxes,
  Network,
  Router,
  Globe,
  Shield,
  Lock,
  Key,
  Users,
  Monitor,
  Smartphone,
  Zap,
  Inbox,
  Workflow,
  Package,
} from "lucide-react";

export const INFRA_ICONS = [
  { name: "Server", Icon: Server },
  { name: "Database", Icon: Database },
  { name: "Cloud", Icon: Cloud },
  { name: "Disk / storage", Icon: HardDrive },
  { name: "Compute", Icon: Cpu },
  { name: "Container", Icon: Container },
  { name: "Cluster", Icon: Boxes },
  { name: "Network", Icon: Network },
  { name: "Router / gateway", Icon: Router },
  { name: "Internet / CDN", Icon: Globe },
  { name: "Firewall", Icon: Shield },
  { name: "Auth", Icon: Lock },
  { name: "Secret / key", Icon: Key },
  { name: "Users", Icon: Users },
  { name: "Client", Icon: Monitor },
  { name: "Mobile", Icon: Smartphone },
  { name: "Function", Icon: Zap },
  { name: "Queue", Icon: Inbox },
  { name: "Workflow", Icon: Workflow },
  { name: "Bucket / package", Icon: Package },
];
