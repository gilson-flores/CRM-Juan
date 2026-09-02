sed -i 's/setDoc(docRef, settings, { merge: true });/setDoc(docRef, sanitizeData(settings), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(docRef, client, { merge: true });/setDoc(docRef, sanitizeData(client), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(docRef, item, { merge: true });/setDoc(docRef, sanitizeData(item), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(doc(db, '\''clients'\'', String(client.id)), client, { merge: true });/setDoc(doc(db, '\''clients'\'', String(client.id)), sanitizeData(client), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(doc(db, '\''quotes'\'', String(quote.id)), quote, { merge: true });/setDoc(doc(db, '\''quotes'\'', String(quote.id)), sanitizeData(quote), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(doc(db, '\''catalog'\'', String(item.id)), item, { merge: true });/setDoc(doc(db, '\''catalog'\'', String(item.id)), sanitizeData(item), { merge: true });/g' lib/firebase.ts
sed -i 's/setDoc(doc(db, '\''company_settings'\'', '\''main'\''), parsed, { merge: true });/setDoc(doc(db, '\''company_settings'\'', '\''main'\''), sanitizeData(parsed), { merge: true });/g' lib/firebase.ts
