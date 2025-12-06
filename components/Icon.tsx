import React from 'react';
import {
  Upload,
  FileText,
  Play,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderInput,
  Terminal,
  Square,
  HardDrive,
  FilePenLine, // 新增导入
  Scissors,
  X,
  Eraser,
  // New icons for Refactor
  Pause,
  List,
  Cpu,
  Shield,
  Wand,
  Zap,
  Database,
  Clock
} from 'lucide-react';

export const Icons = {
  Upload,
  FileText,
  Play,
  Check: CheckCircle,
  Alert: AlertCircle,
  Error: XCircle,
  Retry: RefreshCw,
  Download,
  Trash: Trash2,
  Settings,
  ChevronDown,
  ChevronUp,
  Preview: Eye,
  Folder: FolderInput,
  Terminal,
  // Fix: Added Square directly to Icons to be accessible as Icons.Square for branding.
  // The Stop alias is kept as it's semantically correct for a stop button.
  Square,
  Stop: Square,
  HardDrive, // 新增 HardDrive 图标 
  FilePen: FilePenLine, // 新增 FilePenLine 图标
  Scissors,
  X,
  Eraser,
  Pause,
  List,
  Cpu,
  Shield,
  Refresh: RefreshCw,
  Wand,
  Zap,
  Database,
  Clock
};