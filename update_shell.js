const fs = require('fs');
let code = fs.readFileSync('components/layout/Shell.tsx', 'utf8');

code = code.replace(
  /import \{ usePathname \} from 'next\/navigation';/,
  "import { usePathname, useRouter } from 'next/navigation';\nimport { logout } from '@/lib/firebaseAuth';\nimport { LogOut } from 'lucide-react';"
);

const logoutButtonStr = `
        <div className="p-4 border-t border-[#1a1a1e] bg-[#070707]">
          <button 
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-center gap-2 bg-[#141414] hover:bg-[#1a1a1a] border border-[#27272a] text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-[11px] font-bold transition-all mb-4"
          >
            <LogOut size={14} /> Sair do Sistema
          </button>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse"></span>
              Sistema Operacional
            </span>
            <span className="text-zinc-400 font-mono">v1.2</span>
          </div>
        </div>
`;

code = code.replace(
  /<div className="p-4 border-t border-\[#1a1a1e\] bg-\[#070707\]">[\s\S]*?<\/div>\s*<\/div>\s*<\/aside>/,
  logoutButtonStr + '\n      </aside>'
);

// add router
code = code.replace(
  /const pathname = usePathname\(\);/,
  "const pathname = usePathname();\n  const router = useRouter();"
);

fs.writeFileSync('components/layout/Shell.tsx', code);
console.log('Shell updated');
