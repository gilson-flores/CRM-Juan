const fs = require('fs');
let code = fs.readFileSync('lib/firebaseAuth.ts', 'utf8');

code = code.replace(
  /import \{ getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut \} from 'firebase\/auth';/,
  "import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, type User, signOut } from 'firebase/auth';\nexport type { User };"
);

fs.writeFileSync('lib/firebaseAuth.ts', code);
console.log('updated firebase auth');
