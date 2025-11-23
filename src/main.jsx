import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```
4. Commit

**Fichier 5 : src/App.jsx** (LE PLUS IMPORTANT)
1. **"Add file"** → **"Create new file"**
2. Nomme-le : `src/App.jsx`
3. **Copie TOUT le contenu de ton fichier jsx** (celui avec l'URL de l'API)
4. Commit

---

### **6.4 - Connecte GitHub à Vercel**

1. Va sur [vercel.com](https://vercel.com)
2. Clique **"Sign Up"**
3. Choisis **"Continue with GitHub"**
4. Autorise Vercel à accéder à GitHub

---

### **6.5 - Déploie ton projet**

1. Sur Vercel, clique **"Add New..."** → **"Project"**
2. Tu vas voir la liste de tes repositories GitHub
3. Trouve **"depannfroid-rapports"**
4. Clique **"Import"**
5. Configure :
   - **Framework Preset** : Sélectionne **"Vite"**
   - Build Command : `npm run build` (déjà rempli)
   - Output Directory : `dist` (déjà rempli)
6. Clique **"Deploy"** 🚀

---

### **6.6 - Attends le déploiement**

⏱️ Patiente 2-3 minutes...

Tu vas voir :
- ✅ Building...
- ✅ Deploying...
- 🎉 **Success!**

Vercel te donnera une URL comme :
```
https://depannfroid-rapports.vercel.app
