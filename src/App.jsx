import React, { useState, useEffect, useMemo, useRef } from 'react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, updateDoc, doc, query, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Icons from lucide-react
import { 
    LogIn, LogOut, Target, ListChecks, Sparkles, BrainCircuit, Building, Users, FlaskConical, BarChart, 
    Save, Plus, Trash2, CheckCircle, AlertTriangle, X, TrendingUp, LayoutDashboard, Rocket, ArrowRight, 
    Lightbulb, Settings, ChevronRight, Check, Zap, Edit, UserCheck, Archive, RefreshCw, Flag, MessageSquareWarning,
    Calendar, Users2, Clock, Info, ThumbsUp, ThumbsDown, GitMerge, ChevronsUpDown, AlignLeft
} from 'lucide-react';

// --- Firebase Configuration (Standard Vite/Netlify Method) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// --- Initialize Firebase ---
let app, auth, db;

if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} else {
    console.error("Firebase config is missing or incomplete. Check your environment variables.");
}


// --- Brand Style Component ---
const BrandStyles = () => (
    <>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
        <style>{`
            :root {
                --lh-bg: #F2F2F7;
                --lh-sidebar-bg: #330D53;
                --lh-primary-action: #60189C;
                --lh-text: #008989;
                --lh-highlight: #008989;
                --lh-icon-secondary: #008989;
                --lh-text-secondary: #172755;
            }
            body { font-family: 'Open Sans', sans-serif; color: var(--lh-text-secondary); }
            h1, h2, h3, h4, h5, h6 { font-family: 'Poppins', sans-serif; color: var(--lh-text); }
            .animate-fade-in { animation: fadeIn 0.5s ease-in-out; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
    </>
);


// --- Reusable UI Components ---
const Spinner = ({ className = 'border-white' }) => <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${className}`}></div>;

const NotificationModal = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className="fixed top-5 right-5 bg-white border rounded-lg shadow-xl p-4 w-full max-w-sm z-50 animate-fade-in">
            <div className="flex items-start space-x-3">
                <Icon className={`h-6 w-6 ${isSuccess ? 'text-green-500' : 'text-red-500'}`} />
                <div className="flex-1">
                    <h3 className="font-bold text-base">{isSuccess ? 'Exito' : 'Error'}</h3>
                    <p className="mt-1 text-sm text-gray-600">{message}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
            </div>
        </div>
    );
};

// --- Authentication View ---
const LoginView = () => {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingGuest, setIsLoadingGuest] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoadingGoogle(true);
        const provider = new GoogleAuthProvider();
        try { await signInWithPopup(auth, provider); } 
        catch (error) { console.error("Error during Google sign-in:", error); setIsLoadingGoogle(false); }
    };

    const handleGuestLogin = async () => {
        setIsLoadingGuest(true);
        try { await signInAnonymously(auth); } 
        catch (error) { console.error("Error during guest sign-in:", error); setIsLoadingGuest(false); }
    };

    return (
        <>
            <BrandStyles />
            <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--lh-bg)] p-4">
                <div className="text-center p-8 bg-white shadow-xl rounded-2xl border border-slate-200 max-w-md mx-auto">
                    <Rocket className="h-16 w-16 text-[var(--lh-primary-action)] mx-auto" />
                    <h1 className="text-2xl font-bold mt-4">Bienvenido a la Plataforma OKR de LegalHub</h1>
                    <p className="text-slate-500 mt-2">Inicia sesion para empezar a crear, analizar y seguir tus objetivos.</p>
                    <div className="mt-8 space-y-4">
                        <button onClick={handleGoogleLogin} disabled={isLoadingGoogle || isLoadingGuest} className="w-full flex items-center justify-center gap-3 bg-[var(--lh-primary-action)] text-white font-bold py-3 px-6 rounded-lg hover:bg-[var(--lh-text-secondary)] transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                            {isLoadingGoogle ? <Spinner /> : <LogIn size={20} />} <span>Ingresar con Google</span>
                        </button>
                        <button onClick={handleGuestLogin} disabled={isLoadingGoogle || isLoadingGuest} className="w-full flex items-center justify-center gap-3 bg-[var(--lh-text-secondary)] text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-800 disabled:opacity-50">
                            {isLoadingGuest ? <Spinner /> : <Users size={20} />} <span>Ingresar como Invitado</span>
                        </button>
                    </div>
                     <div className="mt-6 p-3 bg-amber-100 border border-amber-300 rounded-lg text-amber-800 text-xs">
                        <p><strong className="font-bold">Nota:</strong> El inicio de sesion con Google puede fallar en este entorno de vista previa debido a restricciones de dominio.</p>
                        <p className="mt-1">Si ocurre un error, por favor utiliza la opcion de <strong>Ingresar como Invitado</strong> para continuar.</p>
                    </div>
                </div>
            </div>
        </>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ view, setView, user, onSignOut }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'org_okrs', label: 'OKRs Organizacionales', icon: Building },
        { id: 'team_okrs', label: 'OKRs de Equipo', icon: Users },
        { id: 'initiatives', label: 'Iniciativas', icon: FlaskConical },
        { id: 'closure', label: 'Cierre de Ciclo', icon: Archive },
    ];

    return (
        <aside className="w-64 bg-[var(--lh-sidebar-bg)] text-slate-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-purple-900/50 cursor-pointer" onClick={() => setView('home')}>
                <div className="flex items-center gap-3">
                    <Target className="h-10 w-10 text-[var(--lh-highlight)]"/>
                    <div>
                        <h2 className="font-bold text-lg text-white font-['Poppins']">LegalHub</h2>
                        <p className="text-xs text-slate-400">OKR Platform</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
                <h3 className="text-xs font-semibold text-purple-300/50 uppercase tracking-wider">Gestion de OKRs</h3>
                <ul className="space-y-1">
                    {navItems.map(item => (
                         <li key={item.id}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setView(item.id); }}
                               className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === item.id ? 'bg-black/20 text-[var(--lh-highlight)]' : 'text-slate-300 hover:bg-black/20 hover:text-white'}`}>
                                <item.icon className="h-5 w-5" /> <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
                 <h3 className="text-xs font-semibold text-purple-300/50 uppercase tracking-wider pt-4">IMPLEMENTACION</h3>
                 <ul className="space-y-1">
                     <li>
                        <a href="#" onClick={(e) => { e.preventDefault(); setView('setup'); }}
                           className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'setup' ? 'bg-black/20 text-[var(--lh-highlight)]' : 'text-slate-300 hover:bg-black/20 hover:text-white'}`}>
                            <Settings className="h-5 w-5" /> <span>Configuracion</span>
                        </a>
                    </li>
                 </ul>
            </nav>
            <div className="p-4 border-t border-purple-900/50">
                 <div className="flex items-center gap-2">
                    <img src={user.isAnonymous ? `https://placehold.co/40x40/008989/F2F2F7?text=G` : user.photoURL} alt="User" className="w-8 h-8 rounded-full" onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/40x40/008989/F2F2F7?text=${user.displayName?.[0] || 'U'}`; }} />
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">{user.isAnonymous ? "Invitado" : user.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.isAnonymous ? `ID: ${user.uid.substring(0,6)}...` : user.email}</p>
                    </div>
                    <button onClick={onSignOut} title="Cerrar Sesion" className="p-2 rounded-full hover:bg-black/20 text-slate-400 hover:text-white"><LogOut size={18} /></button>
                 </div>
            </div>
        </aside>
    );
}

// --- Main Application Content ---
const AppContent = ({ user }) => {
    const [view, setView] = useState('home');
    const [savedOrgOkrs, setSavedOrgOkrs] = useState([]);
    const [savedTeamOkrs, setSavedTeamOkrs] = useState([]);
    const [savedInitiatives, setSavedInitiatives] = useState([]);
    const [setupConfig, setSetupConfig] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' }); // {message, type}
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    // Firestore paths using the injected appId
    const teamOkrsCollectionPath = `artifacts/${appId}/public/data/okrs`;
    const initiativesCollectionPath = `artifacts/${appId}/public/data/initiatives`;
    const configCollectionPath = `artifacts/${appId}/public/data/config`;
    const reportsCollectionPath = `artifacts/${appId}/public/data/problem_reports`;

    const setNotify = (message, type = 'success') => {
        setNotification({ message, type });
    };

    // Fetch All Data
    useEffect(() => {
        if (!user || !db) return;
        setIsLoading(true);
        const paths = {
            teamOkrs: teamOkrsCollectionPath,
            orgOkrs: doc(db, configCollectionPath, 'organizational_context'),
            setup: doc(db, configCollectionPath, 'implementation_setup'),
            initiatives: initiativesCollectionPath
        };

        const unsubTeamOkrs = onSnapshot(query(collection(db, paths.teamOkrs)), snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedTeamOkrs(data);
        }, (err) => console.error("Error fetching team OKRs:", err));

        const unsubOrgOkrs = onSnapshot(paths.orgOkrs, docSnap => {
            if (docSnap.exists()) setSavedOrgOkrs(docSnap.data().okrs || []);
        }, (err) => console.error("Error fetching org OKRs:", err));
        
        const unsubSetup = onSnapshot(paths.setup, docSnap => {
            if (docSnap.exists()) setSetupConfig(docSnap.data());
        }, (err) => console.error("Error fetching setup config:", err));
        
        const unsubInitiatives = onSnapshot(query(collection(db, paths.initiatives)), snapshot => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSavedInitiatives(data);
        }, (err) => console.error("Error fetching initiatives:", err));

        setIsLoading(false);
        return () => { unsubTeamOkrs(); unsubOrgOkrs(); unsubSetup(); unsubInitiatives(); };
    }, [user]);

    const handleSignOut = async () => { await signOut(auth); };

    // --- Data Manipulation Handlers ---
    const handleSaveOrgOkrs = async (newOkrs) => {
        const orgContextDocRef = doc(db, configCollectionPath, 'organizational_context');
        try {
            await setDoc(orgContextDocRef, { okrs: newOkrs });
            setNotify("OKRs Organizacionales guardados con exito.");
        } catch(e) { setNotify("No se pudieron guardar los OKRs Organizacionales.", "error"); }
    };

    const handleSaveSetup = async (newConfig) => {
        const setupDocRef = doc(db, configCollectionPath, 'implementation_setup');
        try {
            await setDoc(setupDocRef, newConfig, { merge: true });
            setNotify("Configuracion de implementacion guardada.");
        } catch(e) { setNotify("No se pudo guardar la configuracion.", "error"); }
    };
    
    const handleAddTeamOkr = async (okrData) => {
        try {
            await addDoc(collection(db, teamOkrsCollectionPath), okrData);
            setNotify("OKR de equipo creado con exito.");
            setView('dashboard');
        } catch (e) {
            console.error("Error adding team OKR:", e);
            setNotify("No se pudo crear el OKR de equipo.", "error");
        }
    };
    
    const handleDeleteTeamOkr = async (okrId) => {
        try {
            await deleteDoc(doc(db, teamOkrsCollectionPath, okrId));
            setNotify("OKR de equipo eliminado.");
        } catch (e) {
            console.error("Error deleting team OKR:", e);
            setNotify("No se pudo eliminar el OKR.", "error");
        }
    };

    const handleUpdateTeamOkr = async (okrId, data) => {
        try {
            await updateDoc(doc(db, teamOkrsCollectionPath, okrId), data);
            setNotify("OKR de equipo actualizado.");
        } catch (e) {
             console.error("Error updating team OKR:", e);
            setNotify("No se pudo actualizar el OKR.", "error");
        }
    };

    const handleSaveInitiative = async (initiative) => {
        try {
            if (initiative.id) {
                await updateDoc(doc(db, initiativesCollectionPath, initiative.id), initiative);
                setNotify("Iniciativa actualizada con exito.");
            } else {
                await addDoc(collection(db, initiativesCollectionPath), initiative);
                setNotify("Iniciativa creada con exito.");
            }
        } catch(e) {
            console.error("Error saving initiative:", e);
            setNotify("No se pudo guardar la iniciativa.", "error");
        }
    };

    const handleReportProblem = async (description) => {
        const report = {
            description, view, userId: user.uid, userEmail: user.email,
            userName: user.displayName, timestamp: new Date().toISOString(), appId
        };
        try {
            await addDoc(collection(db, reportsCollectionPath), report);
            setNotify("Tu reporte ha sido enviado. Gracias por tu feedback!");
        } catch(e) {
            setNotify("No se pudo enviar el reporte.", "error");
            console.error("Error sending report:", e);
        }
    };
    
    const renderView = () => {
        switch (view) {
            case 'home': return <HomeView setView={setView} orgOkrs={savedOrgOkrs} setupConfig={setupConfig} />;
            case 'setup': return <ConfigurationView savedConfig={setupConfig} onSave={handleSaveSetup} setNotify={setNotify}/>;
            case 'org_okrs': return <OrgOkrView savedOrgOkrs={savedOrgOkrs} onSave={handleSaveOrgOkrs} setNotify={setNotify} />;
            case 'team_okrs': return <TeamOkrCreationView savedOrgOkrs={savedOrgOkrs} user={user} onSave={handleAddTeamOkr} setNotify={setNotify} />;
            case 'dashboard': return <OKRDashboardView teamOkrs={savedTeamOkrs} initiatives={savedInitiatives} isLoading={isLoading} onUpdate={handleUpdateTeamOkr} onDelete={handleDeleteTeamOkr} currentUser={user} setNotify={setNotify} />;
            case 'initiatives': return <InitiativesView teamOkrs={savedTeamOkrs} initiatives={savedInitiatives} onSave={handleSaveInitiative} isLoading={isLoading} setNotify={setNotify} />;
            case 'closure': return <CycleClosureView teamOkrs={savedTeamOkrs} onUpdate={handleUpdateTeamOkr} isLoading={isLoading} setNotify={setNotify} />;
            default: return <HomeView setView={setView} orgOkrs={savedOrgOkrs} setupConfig={setupConfig} />;
        }
    };

    return (
        <div className="flex h-screen bg-[var(--lh-bg)]">
            <BrandStyles />
            <NotificationModal message={notification.message} type={notification.type} onClose={() => setNotification({message: '', type: ''})} />
            <Sidebar view={view} setView={setView} user={user} onSignOut={handleSignOut} />
            <main className="flex-1 overflow-y-auto">
                <div className="p-6 md:p-8 lg:p-10">
                    {savedOrgOkrs.length > 0 && !['home', 'org_okrs', 'setup'].includes(view) && <OrgContextBanner orgOkrs={savedOrgOkrs} />}
                    {renderView()}
                </div>
            </main>
            <button onClick={() => setIsReportModalOpen(true)} className="fixed bottom-6 right-6 bg-amber-500 text-white p-4 rounded-full shadow-lg hover:bg-amber-600 transition-colors z-40" title="Reportar un problema">
                <MessageSquareWarning size={24} />
            </button>
            <ReportProblemModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onSave={handleReportProblem} />
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        if (!auth) {
            setIsAuthReady(true);
            return;
        }
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else if (initialAuthToken) {
                try {
                    await signInWithCustomToken(auth, initialAuthToken);
                } catch (e) {
                    console.error("Custom token sign-in failed, trying anonymous", e);
                    await signInAnonymously(auth);
                }
            } else {
                setUser(null); // No user, show login view
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    if (!isAuthReady) {
        return <div className="flex items-center justify-center h-screen bg-slate-50"><Spinner className="border-[var(--lh-primary-action)]" /> <p className="ml-4">Conectando...</p></div>;
    }
    
    if (!db) {
         return <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-4">
            <AlertTriangle size={48} />
            <h1 className="text-2xl font-bold mt-4">Error de Configuracion</h1>
            <p className="mt-2 text-center">La configuracion de Firebase no se ha proporcionado. La aplicacion no puede iniciarse.</p>
        </div>;
    }

    return user ? <AppContent user={user} /> : <LoginView />;
}

// --- VIEWS AND SUB-COMPONENTS (Full Implementation) ---

const HomeView = ({ setView, orgOkrs, setupConfig }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
                <h1 className="text-3xl font-bold">Bienvenido a la Plataforma OKR de LegalHub</h1>
                <p className="text-lg text-[var(--lh-text-secondary)] mt-2 max-w-2xl mx-auto">"Los OKR son el puente entre la estrategia y la ejecucion."</p>
                <p className="text-sm text-slate-500 mt-1">Un sistema simple para alinear equipos, promover el foco y lograr resultados extraordinarios.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Building size={22}/> OKRs Organizacionales Activos</h3>
                    {orgOkrs.length > 0 ? (
                        <div className="space-y-4">
                            {orgOkrs.map((okr, index) => (
                                <div key={index} className="bg-slate-50 p-4 rounded-lg border">
                                    <h4 className="font-semibold text-base text-[var(--lh-primary-action)] flex items-center gap-2"><Target size={16}/>{okr.objective}</h4>
                                    <ul className="mt-2 pl-6 space-y-1 list-disc list-inside">
                                        {okr.keyResults.map((kr, i) => <li key={i} className="text-sm text-[var(--lh-text-secondary)]">{kr.name}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-slate-500">Aun no se han definido los OKRs Organizacionales.</p>
                            <button onClick={() => setView('org_okrs')} className="mt-4 text-sm font-semibold text-[var(--lh-primary-action)] hover:underline">Definir ahora <ArrowRight className="inline-block" size={16}/></button>
                        </div>
                    )}
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><UserCheck size={22}/> Embajadores</h3>
                     <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold text-[var(--lh-text-secondary)]">Embajador Organizacional</p>
                            <p className="font-bold text-[var(--lh-primary-action)]">{setupConfig.organizationalAmbassador || "No definido"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[var(--lh-text-secondary)]">Embajadores de Equipo</p>
                            <ul className="space-y-1 mt-1">
                                {(setupConfig.teamAmbassadors || []).length > 0 ? (
                                    setupConfig.teamAmbassadors.map((amb, i) => (
                                        <li key={i} className="text-sm">
                                            <span className="font-semibold">{amb.team}:</span> <span className="text-slate-600">{amb.name}</span>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">No definidos.</p>
                                )}
                            </ul>
                        </div>
                        <button onClick={() => setView('setup')} className="w-full mt-4 text-sm font-semibold text-[var(--lh-primary-action)] text-center hover:underline">Gestionar Embajadores <ArrowRight className="inline-block" size={16}/></button>
                     </div>
                </div>
            </div>
        </div>
    );
};

const OrgContextBanner = ({ orgOkrs }) => {
    const firstObjective = orgOkrs[0]?.objective;
    if (!firstObjective) return null;
    return (
        <div className="bg-blue-50 border-l-4 border-[var(--lh-highlight)] text-[var(--lh-text)] p-4 rounded-r-lg mb-8 animate-fade-in">
            <div className="flex">
                <div className="py-1"><Target className="h-5 w-5 text-[var(--lh-highlight)] mr-3" /></div>
                <div>
                    <p className="font-bold text-sm">Alineado con el Objetivo Organizacional Principal:</p>
                    <p className="text-sm">"{firstObjective}"</p>
                </div>
            </div>
        </div>
    );
};

const ConfigurationView = ({ savedConfig, onSave, setNotify }) => {
    const [config, setConfig] = useState(savedConfig || {});
    const [activeTab, setActiveTab] = useState('cycle');

    useEffect(() => {
        setConfig(savedConfig);
    }, [savedConfig]);

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(config);
    };

    const tabs = [
        { id: 'cycle', label: 'Diseno del Ciclo', icon: RefreshCw },
        { id: 'ambassadors', label: 'Embajadores', icon: UserCheck }
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Configuracion de Implementacion</h1>
            <p className="text-slate-500 mb-6">Define los parametros clave para el exito de los OKRs en tu organizacion.</p>
            
            <div className="flex border-b mb-6">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm ${activeTab === tab.id ? 'border-b-2 border-[var(--lh-primary-action)] text-[var(--lh-primary-action)]' : 'text-slate-500 hover:text-slate-800'}`}>
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                {activeTab === 'cycle' && <Step1CycleDesign config={config} updateConfig={updateConfig} />}
                {activeTab === 'ambassadors' && <Step2Ambassadors config={config} updateConfig={updateConfig} />}
            </div>

            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} className="bg-[var(--lh-primary-action)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--lh-text-secondary)] flex items-center gap-2">
                    <Save size={18} /> Guardar Configuracion
                </button>
            </div>
        </div>
    );
};

const Step1CycleDesign = ({ config, updateConfig }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-bold text-[var(--lh-text-secondary)]">Duracion del Ciclo</h3>
            <p className="text-sm text-slate-500 mb-2">Establece la cadencia con la que se definiran y revisaran los OKRs.</p>
            <select value={config.cycleDuration || '3'} onChange={e => updateConfig('cycleDuration', e.target.value)} className="w-full p-2 border rounded-lg">
                <option value="1">Mensual (1 mes)</option>
                <option value="3">Trimestral (3 meses)</option>
                <option value="6">Semestral (6 meses)</option>
            </select>
        </div>
        <div>
            <h3 className="text-lg font-bold text-[var(--lh-text-secondary)]">Fechas Clave del Ciclo Actual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                    <label className="text-sm font-medium">Fecha de Inicio</label>
                    <input type="date" value={config.cycleStartDate || ''} onChange={e => updateConfig('cycleStartDate', e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                </div>
                <div>
                    <label className="text-sm font-medium">Fecha de Cierre</label>
                    <input type="date" value={config.cycleEndDate || ''} onChange={e => updateConfig('cycleEndDate', e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                </div>
            </div>
        </div>
    </div>
);

const Step2Ambassadors = ({ config, updateConfig }) => {
    const handleTeamAmbassadorsChange = (index, field, value) => {
        const updated = [...(config.teamAmbassadors || [])];
        updated[index][field] = value;
        updateConfig('teamAmbassadors', updated);
    };

    const addTeamAmbassador = () => {
        const updated = [...(config.teamAmbassadors || []), { team: '', name: '' }];
        updateConfig('teamAmbassadors', updated);
    };
    
    const removeTeamAmbassador = (index) => {
        const updated = (config.teamAmbassadors || []).filter((_, i) => i !== index);
        updateConfig('teamAmbassadors', updated);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-[var(--lh-text-secondary)]">Embajador Organizacional</h3>
                <p className="text-sm text-slate-500 mb-2">La persona responsable de facilitar el proceso de OKRs a nivel de toda la empresa.</p>
                <input type="text" placeholder="Nombre del Embajador" value={config.organizationalAmbassador || ''} onChange={e => updateConfig('organizationalAmbassador', e.target.value)} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-[var(--lh-text-secondary)]">Embajadores de Equipo</h3>
                <p className="text-sm text-slate-500 mb-2">Los puntos de contacto para cada equipo, responsables de guiar a sus companeros.</p>
                <div className="space-y-3">
                    {(config.teamAmbassadors || []).map((amb, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                            <input type="text" placeholder="Nombre del Equipo" value={amb.team} onChange={e => handleTeamAmbassadorsChange(index, 'team', e.target.value)} className="w-1/2 p-2 border rounded-lg" />
                            <input type="text" placeholder="Nombre del Embajador" value={amb.name} onChange={e => handleTeamAmbassadorsChange(index, 'name', e.target.value)} className="w-1/2 p-2 border rounded-lg" />
                            <button onClick={() => removeTeamAmbassador(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                        </div>
                    ))}
                </div>
                <button onClick={addTeamAmbassador} className="mt-4 text-sm font-semibold text-[var(--lh-primary-action)] flex items-center gap-1"><Plus size={16} /> Anadir Embajador de Equipo</button>
            </div>
        </div>
    );
};

const OrgOkrView = ({ savedOrgOkrs, onSave, setNotify }) => {
    const [draftOkrs, setDraftOkrs] = useState(savedOrgOkrs || [{ objective: '', keyResults: [{name: ''}] }]);

    useEffect(() => {
        if (savedOrgOkrs && savedOrgOkrs.length > 0) {
            setDraftOkrs(savedOrgOkrs);
        } else {
            setDraftOkrs([{ objective: '', keyResults: [{name: ''}] }]);
        }
    }, [savedOrgOkrs]);

    const handleObjectiveChange = (index, value) => {
        const updated = [...draftOkrs];
        updated[index].objective = value;
        setDraftOkrs(updated);
    };

    const handleKrChange = (okrIndex, krIndex, value) => {
        const updated = [...draftOkrs];
        updated[okrIndex].keyResults[krIndex].name = value;
        setDraftOkrs(updated);
    };

    const addKr = (okrIndex) => {
        const updated = [...draftOkrs];
        updated[okrIndex].keyResults.push({name: ''});
        setDraftOkrs(updated);
    };

    const removeKr = (okrIndex, krIndex) => {
        const updated = [...draftOkrs];
        updated[okrIndex].keyResults = updated[okrIndex].keyResults.filter((_, i) => i !== krIndex);
        setDraftOkrs(updated);
    };
    
    const addOkr = () => {
        setDraftOkrs([...draftOkrs, { objective: '', keyResults: [{name: ''}] }]);
    };
    
    const removeOkr = (index) => {
        setDraftOkrs(draftOkrs.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const isValid = draftOkrs.every(okr => okr.objective.trim() !== '' && okr.keyResults.every(kr => kr.name.trim() !== ''));
        if (!isValid) {
            setNotify("Por favor, completa todos los campos de objetivos y resultados clave.", "error");
            return;
        }
        onSave(draftOkrs);
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">OKRs Organizacionales</h1>
            <p className="text-slate-500 mb-6">Define los objetivos estrategicos que guiaran a toda la empresa durante este ciclo.</p>
            
            <div className="space-y-6">
                {draftOkrs.map((okr, okrIndex) => (
                    <div key={okrIndex} className="bg-white p-6 rounded-xl shadow-sm border relative">
                        <div className="mb-4">
                            <label className="text-lg font-bold text-[var(--lh-text-secondary)] flex items-center gap-2"><Target/> Objetivo</label>
                            <input type="text" placeholder="Ej: Convertirnos en lideres del mercado regional" value={okr.objective} onChange={e => handleObjectiveChange(okrIndex, e.target.value)} className="w-full p-2 border rounded-lg mt-2 text-lg" />
                        </div>
                        <div>
                            <label className="text-lg font-bold text-[var(--lh-text-secondary)] flex items-center gap-2"><ListChecks/> Resultados Clave</label>
                            <div className="space-y-2 mt-2">
                                {okr.keyResults.map((kr, krIndex) => (
                                    <div key={krIndex} className="flex items-center gap-2">
                                        <input type="text" placeholder="Ej: Aumentar la cuota de mercado del 15% al 25%" value={kr.name} onChange={e => handleKrChange(okrIndex, krIndex, e.target.value)} className="w-full p-2 border rounded-lg" />
                                        <button onClick={() => removeKr(okrIndex, krIndex)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addKr(okrIndex)} className="mt-2 text-sm font-semibold text-[var(--lh-primary-action)] flex items-center gap-1"><Plus size={16} /> Anadir Resultado Clave</button>
                        </div>
                        {draftOkrs.length > 1 && (
                            <button onClick={() => removeOkr(okrIndex)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"><X size={18} /></button>
                        )}
                    </div>
                ))}
            </div>
            
            <button onClick={addOkr} className="mt-6 bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 flex items-center gap-2">
                <Plus size={18} /> Anadir Otro Objetivo
            </button>

            <div className="mt-8 flex justify-end">
                <button onClick={handleSave} className="bg-[var(--lh-primary-action)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--lh-text-secondary)] flex items-center gap-2 shadow-lg">
                    <Save size={20} /> Guardar OKRs Organizacionales
                </button>
            </div>
        </div>
    );
};

const TeamOkrCreationView = ({ savedOrgOkrs, user, onSave, setNotify }) => {
    const [objective, setObjective] = useState('');
    const [keyResults, setKeyResults] = useState([{ name: '', type: 'metric', startValue: 0, targetValue: 100, currentValue: 0 }]);
    const [alignment, setAlignment] = useState('');

    const addKr = () => {
        setKeyResults([...keyResults, { name: '', type: 'metric', startValue: 0, targetValue: 100, currentValue: 0 }]);
    };

    const removeKr = (index) => {
        setKeyResults(keyResults.filter((_, i) => i !== index));
    };

    const handleKrChange = (index, field, value) => {
        const updated = [...keyResults];
        updated[index][field] = value;
        setKeyResults(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!objective.trim() || keyResults.some(kr => !kr.name.trim())) {
            setNotify("Por favor, completa el objetivo y todos los resultados clave.", "error");
            return;
        }

        const newOkr = {
            objective,
            keyResults,
            alignedTo: alignment,
            team: "Equipo General", // Placeholder, could be dynamic
            status: "Activo",
            healthStatus: "on_track",
            progress: 0,
            userId: user.uid,
            author: user.displayName || "Usuario Anonimo",
            createdAt: new Date().toISOString()
        };
        onSave(newOkr);
    };

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Crear OKR de Equipo</h1>
                <p className="text-slate-500 mt-1">Define un objetivo para tu equipo que contribuya a la estrategia organizacional.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <label className="text-lg font-bold text-[var(--lh-text-secondary)] flex items-center gap-2"><Target/> Objetivo del Equipo</label>
                <p className="text-sm text-slate-500 mb-2">Que meta inspiradora y cualitativa quiere alcanzar tu equipo?</p>
                <input type="text" placeholder="Ej: Optimizar la experiencia de onboarding de nuevos clientes" value={objective} onChange={e => setObjective(e.target.value)} className="w-full p-3 border rounded-lg text-lg" required />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <label className="text-lg font-bold text-[var(--lh-text-secondary)] flex items-center gap-2"><GitMerge/> Alineacion Estrategica</label>
                <p className="text-sm text-slate-500 mb-2">A que objetivo organizacional contribuye este OKR de equipo?</p>
                <select value={alignment} onChange={e => setAlignment(e.target.value)} className="w-full p-3 border rounded-lg" required>
                    <option value="">Selecciona un Objetivo Organizacional</option>
                    {savedOrgOkrs.map((okr, index) => (
                        <option key={index} value={okr.objective}>{okr.objective}</option>
                    ))}
                </select>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <label className="text-lg font-bold text-[var(--lh-text-secondary)] flex items-center gap-2"><ListChecks/> Resultados Clave</label>
                <p className="text-sm text-slate-500 mb-2">Como mediras el exito de tu objetivo? Define 2-5 resultados medibles.</p>
                <div className="space-y-4">
                    {keyResults.map((kr, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-lg border flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                               <input type="text" placeholder="Ej: Reducir el tiempo de activacion de 3 a 1 dia" value={kr.name} onChange={e => handleKrChange(index, 'name', e.target.value)} className="flex-grow p-2 border rounded-lg" required />
                               <button type="button" onClick={() => removeKr(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={addKr} className="mt-4 text-sm font-semibold text-[var(--lh-primary-action)] flex items-center gap-1"><Plus size={16} /> Anadir Resultado Clave</button>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="bg-[var(--lh-primary-action)] text-white font-bold py-3 px-8 rounded-lg hover:bg-[var(--lh-text-secondary)] flex items-center gap-2 shadow-lg">
                    <Save size={20} /> Crear OKR de Equipo
                </button>
            </div>
        </form>
    );
};

const OKRDashboardView = ({ teamOkrs, initiatives, isLoading, onUpdate, onDelete, currentUser, setNotify }) => {
    if (isLoading) return <div className="flex justify-center items-center p-10"><Spinner className="border-[var(--lh-primary-action)]"/></div>;
    if (teamOkrs.length === 0) return (
        <div className="text-center py-20">
            <Users size={48} className="mx-auto text-slate-400" />
            <h2 className="text-2xl font-bold mt-4">No hay OKRs de equipo todavia</h2>
            <p className="text-slate-500 mt-2">Crea el primer OKR de equipo para empezar a seguir el progreso.</p>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-6">
             <div>
                <h1 className="text-3xl font-bold">Dashboard de OKRs de Equipo</h1>
                <p className="text-slate-500 mt-1">Sigue el progreso, actualiza el estado y colabora en los objetivos de tu equipo.</p>
            </div>
            {teamOkrs.map(okr => (
                <OkrCard key={okr.id} okr={okr} initiatives={initiatives.filter(i => i.linkedOkrId === okr.id)} onUpdate={onUpdate} onDelete={onDelete} currentUser={currentUser} setNotify={setNotify} />
            ))}
        </div>
    );
};

const OkrCard = ({ okr, initiatives, onUpdate, onDelete, currentUser, setNotify }) => {
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [selectedKrIndex, setSelectedKrIndex] = useState(null);
    
    const calculateOverallProgress = (keyResults) => {
        if (!keyResults || keyResults.length === 0) return 0;
        const totalProgress = keyResults.reduce((acc, kr) => {
            const progress = kr.progress || [];
            const latestProgress = progress.length > 0 ? progress[progress.length - 1].value : 0;
            return acc + (latestProgress || 0);
        }, 0);
        return Math.round(totalProgress / keyResults.length);
    };
    
    const overallProgress = useMemo(() => calculateOverallProgress(okr.keyResults), [okr.keyResults]);

    const handleAddProgressClick = (krIndex) => {
        setSelectedKrIndex(krIndex);
        setIsProgressModalOpen(true);
    };

    const handleSaveProgress = (krIndex, progressData) => {
        const updatedKrs = [...okr.keyResults];
        if (!updatedKrs[krIndex].progress) {
            updatedKrs[krIndex].progress = [];
        }
        updatedKrs[krIndex].progress.push({
            ...progressData,
            date: new Date().toISOString(),
            author: currentUser.displayName || "Invitado"
        });
        onUpdate(okr.id, { keyResults: updatedKrs });
        setIsProgressModalOpen(false);
        setNotify("Progreso registrado con exito.");
    };

    const handleStatusChange = (newStatus) => {
        onUpdate(okr.id, { healthStatus: newStatus });
    };

    const isOwner = okr.userId === currentUser.uid;

    const healthStatusMap = {
        on_track: { text: "En Curso", color: "bg-green-500", icon: TrendingUp },
        at_risk: { text: "En Riesgo", color: "bg-yellow-500", icon: AlertTriangle },
        off_track: { text: "Desviado", color: "bg-red-500", icon: Flag },
    };
    const currentHealth = healthStatusMap[okr.healthStatus || 'on_track'];

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-slate-500">{okr.team}</p>
                    <h3 className="text-xl font-bold text-[var(--lh-primary-action)] mt-1">{okr.objective}</h3>
                    {okr.alignedTo && <p className="text-xs text-slate-400 mt-1">Alineado con: "{okr.alignedTo}"</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <div className={`flex items-center gap-2 text-sm font-semibold text-white px-3 py-1 rounded-full ${currentHealth.color}`}>
                        <currentHealth.icon size={14}/>
                        <span>{currentHealth.text}</span>
                    </div>
                    {isOwner && (
                         <div className="relative group">
                            <button className="p-2 hover:bg-slate-100 rounded-full"><ChevronsUpDown size={18}/></button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-10 hidden group-hover:block">
                                <button onClick={() => handleStatusChange('on_track')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><TrendingUp className="text-green-500" size={16}/> En Curso</button>
                                <button onClick={() => handleStatusChange('at_risk')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><AlertTriangle className="text-yellow-500" size={16}/> En Riesgo</button>
                                <button onClick={() => handleStatusChange('off_track')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"><Flag className="text-red-500" size={16}/> Desviado</button>
                                <div className="border-t my-1"></div>
                                <button onClick={() => onDelete(okr.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><Trash2 size={16}/> Eliminar OKR</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold">Progreso General</span>
                    <span className="text-sm font-bold text-[var(--lh-primary-action)]">{overallProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-[var(--lh-highlight)] h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {okr.keyResults.map((kr, index) => (
                    <KrTracker key={index} kr={kr} canUpdate={isOwner} onAddProgressClick={() => handleAddProgressClick(index)} />
                ))}
            </div>
            
            {isProgressModalOpen && selectedKrIndex !== null && (
                <ProgressModal 
                    kr={okr.keyResults[selectedKrIndex]} 
                    isOpen={isProgressModalOpen} 
                    onClose={() => setIsProgressModalOpen(false)} 
                    onSave={(data) => handleSaveProgress(selectedKrIndex, data)}
                />
            )}
        </div>
    );
};

const KrTracker = ({ kr, canUpdate, onAddProgressClick }) => {
    const latestProgress = kr.progress && kr.progress.length > 0 ? kr.progress[kr.progress.length - 1].value : 0;
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
                <p className="flex-1 font-semibold text-sm text-[var(--lh-text-secondary)]">{kr.name}</p>
                {canUpdate && (
                    <button onClick={onAddProgressClick} className="text-xs font-bold text-white bg-[var(--lh-primary-action)] px-3 py-1 rounded-full hover:bg-[var(--lh-text-secondary)]">
                        Actualizar
                    </button>
                )}
            </div>
            <div className="flex items-center gap-4 mt-2">
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-[var(--lh-highlight)] h-2 rounded-full" style={{ width: `${latestProgress}%` }}></div>
                </div>
                <span className="text-sm font-bold w-12 text-right">{latestProgress}%</span>
            </div>
        </div>
    );
};

const ProgressModal = ({ kr, isOpen, onClose, onSave }) => {
    const [value, setValue] = useState(0);
    const [comment, setComment] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ value: parseInt(value, 10), comment });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="font-bold text-lg">Actualizar Progreso</h3>
                <p className="text-sm text-slate-600 mt-1">"{kr.name}"</p>
                <div className="my-6">
                    <label className="font-semibold">Progreso Actual (%)</label>
                    <input type="range" min="0" max="100" value={value} onChange={e => setValue(e.target.value)} className="w-full mt-2" />
                    <p className="text-center text-2xl font-bold mt-2">{value}%</p>
                </div>
                <div className="my-4">
                    <label className="font-semibold">Comentario (Opcional)</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Anade contexto sobre la actualizacion..." rows={3} className="w-full p-2 border rounded-lg mt-1"></textarea>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[var(--lh-primary-action)] rounded-lg hover:bg-[var(--lh-text-secondary)]">Guardar</button>
                </div>
            </div>
        </div>
    );
};

const InitiativesView = ({ teamOkrs, initiatives, onSave, isLoading, setNotify }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInitiative, setSelectedInitiative] = useState(null);

    const handleOpenModal = (initiative = null) => {
        setSelectedInitiative(initiative);
        setIsModalOpen(true);
    };

    const handleSaveInitiative = (data) => {
        onSave(data);
        setIsModalOpen(false);
    };

    const getOkrObjectiveById = (okrId) => {
        const okr = teamOkrs.find(o => o.id === okrId);
        return okr ? okr.objective : "OKR no encontrado";
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Iniciativas Estrategicas</h1>
                    <p className="text-slate-500 mt-1">Proyectos y tareas clave que impulsan tus Resultados Clave.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="bg-[var(--lh-primary-action)] text-white font-bold py-2 px-5 rounded-lg hover:bg-[var(--lh-text-secondary)] flex items-center gap-2">
                    <Plus size={18} /> Nueva Iniciativa
                </button>
            </div>
            {isLoading ? <Spinner className="border-[var(--lh-primary-action)]"/> : (
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3 text-sm font-semibold uppercase text-slate-500">Iniciativa</th>
                                <th className="text-left p-3 text-sm font-semibold uppercase text-slate-500">OKR Vinculado</th>
                                <th className="text-left p-3 text-sm font-semibold uppercase text-slate-500">Estado</th>
                                <th className="text-left p-3 text-sm font-semibold uppercase text-slate-500">Responsable</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {initiatives.map(initiative => (
                                <tr key={initiative.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-semibold">{initiative.name}</td>
                                    <td className="p-3 text-sm text-slate-600">{getOkrObjectiveById(initiative.linkedOkrId)}</td>
                                    <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${initiative.status === 'Completado' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{initiative.status}</span></td>
                                    <td className="p-3 text-sm">{initiative.owner}</td>
                                    <td className="p-3 text-right">
                                        <button onClick={() => handleOpenModal(initiative)} className="p-2 text-slate-500 hover:text-[var(--lh-primary-action)]"><Edit size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {initiatives.length === 0 && <p className="text-center p-10 text-slate-500">No hay iniciativas creadas.</p>}
                </div>
            )}
            {isModalOpen && <InitiativeModal isOpen={isModalOpen} initialData={selectedInitiative} onClose={() => setIsModalOpen(false)} teamOkrs={teamOkrs} onSave={handleSaveInitiative} />}
        </div>
    );
};

const InitiativeModal = ({ isOpen, initialData, onClose, teamOkrs, onSave }) => {
    const [initiative, setInitiative] = useState(initialData || { name: '', description: '', owner: '', linkedOkrId: '', status: 'Pendiente' });
    
    const handleChange = (field, value) => {
        setInitiative(prev => ({...prev, [field]: value}));
    };

    const handleSubmit = () => {
        if (!initiative.name || !initiative.linkedOkrId) return;
        onSave(initiative);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <h3 className="font-bold text-xl mb-4">{initialData ? 'Editar' : 'Nueva'} Iniciativa</h3>
                <div className="space-y-4">
                    <div>
                        <label className="font-semibold">Nombre de la Iniciativa</label>
                        <input type="text" value={initiative.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                    </div>
                    <div>
                        <label className="font-semibold">Descripcion</label>
                        <textarea value={initiative.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full p-2 border rounded-lg mt-1"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="font-semibold">Responsable</label>
                            <input type="text" value={initiative.owner} onChange={e => handleChange('owner', e.target.value)} className="w-full p-2 border rounded-lg mt-1" />
                        </div>
                        <div>
                            <label className="font-semibold">Estado</label>
                            <select value={initiative.status} onChange={e => handleChange('status', e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                                <option>Pendiente</option>
                                <option>En Progreso</option>
                                <option>Completado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="font-semibold">Vincular a OKR de Equipo</label>
                        <select value={initiative.linkedOkrId} onChange={e => handleChange('linkedOkrId', e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                            <option value="">Seleccionar OKR</option>
                            {teamOkrs.map(okr => <option key={okr.id} value={okr.id}>{okr.objective}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-[var(--lh-primary-action)] rounded-lg hover:bg-[var(--lh-text-secondary)]">Guardar Iniciativa</button>
                </div>
            </div>
        </div>
    );
};

const CycleClosureView = ({ teamOkrs, onUpdate, isLoading, setNotify }) => {
    const [selectedOkr, setSelectedOkr] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const activeOkrs = teamOkrs.filter(o => o.status !== 'Cerrado');
    const closedOkrs = teamOkrs.filter(o => o.status === 'Cerrado');

    const handleOpenModal = (okr) => {
        setSelectedOkr(okr);
        setIsModalOpen(true);
    };

    const handleCloseOkr = (okrId, retrospective) => {
        onUpdate(okrId, { status: 'Cerrado', retrospective });
        setIsModalOpen(false);
        setNotify("OKR cerrado y reflexion guardada con exito.");
    };

    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold">Cierre de Ciclo</h1>
            <p className="text-slate-500 mt-1 mb-6">Reflexiona sobre los resultados, celebra los logros y aprende de los desafios.</p>
            
            <div className="mb-8">
                <h2 className="text-xl font-bold mb-3">OKRs Activos para Cerrar</h2>
                {activeOkrs.length > 0 ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                        {activeOkrs.map(okr => (
                            <div key={okr.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50">
                                <div>
                                    <p className="font-semibold">{okr.objective}</p>
                                    <p className="text-sm text-slate-500">{okr.team}</p>
                                </div>
                                <button onClick={() => handleOpenModal(okr)} className="bg-blue-500 text-white font-bold py-1 px-4 rounded-lg hover:bg-blue-600">Cerrar</button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-slate-500">No hay OKRs activos para cerrar.</p>}
            </div>
            
            <div>
                <h2 className="text-xl font-bold mb-3">Historial de OKRs Cerrados</h2>
                {closedOkrs.length > 0 ? (
                    <div className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
                        {closedOkrs.map(okr => (
                            <div key={okr.id} className="p-4 bg-slate-100 rounded-lg">
                                <p className="font-semibold">{okr.objective}</p>
                                <div className="mt-2 text-sm text-slate-600 bg-white p-3 rounded">
                                    <p><strong>Reflexion:</strong> {okr.retrospective?.reflection || "N/A"}</p>
                                    <p><strong>Logros:</strong> {okr.retrospective?.achievements || "N/A"}</p>
                                    <p><strong>Aprendizajes:</strong> {okr.retrospective?.learnings || "N/A"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-slate-500">Aun no se han cerrado OKRs en este ciclo.</p>}
            </div>

            {isModalOpen && <CloseOkrModal okr={selectedOkr} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCloseOkr} />}
        </div>
    );
};

const CloseOkrModal = ({ okr, isOpen, onClose, onSave }) => {
    const [retrospective, setRetrospective] = useState({ reflection: '', achievements: '', learnings: '' });

    const handleChange = (field, value) => {
        setRetrospective(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(okr.id, retrospective);
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                <h3 className="font-bold text-xl">Cerrar y Reflexionar sobre el OKR</h3>
                <p className="text-slate-600 mt-1">"{okr.objective}"</p>
                <div className="space-y-4 mt-6">
                    <div>
                        <label className="font-semibold">Reflexion General</label>
                        <textarea onChange={e => handleChange('reflection', e.target.value)} rows={3} className="w-full p-2 border rounded-lg mt-1" placeholder="Como fue el desempeno general? Que factores influyeron?"></textarea>
                    </div>
                     <div>
                        <label className="font-semibold">Principales Logros</label>
                        <textarea onChange={e => handleChange('achievements', e.target.value)} rows={3} className="w-full p-2 border rounded-lg mt-1" placeholder="Cuales fueron las victorias mas importantes?"></textarea>
                    </div>
                     <div>
                        <label className="font-semibold">Aprendizajes Clave</label>
                        <textarea onChange={e => handleChange('learnings', e.target.value)} rows={3} className="w-full p-2 border rounded-lg mt-1" placeholder="Que aprendimos que podamos aplicar en el futuro?"></textarea>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[var(--lh-primary-action)] rounded-lg hover:bg-[var(--lh-text-secondary)]">Confirmar Cierre</button>
                </div>
            </div>
        </div>
    );
};

const ReportProblemModal = ({ isOpen, onClose, onSave }) => {
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!description.trim()) return;
        onSave(description);
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Reportar un Problema</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <p className="text-sm text-[var(--lh-text-secondary)]">Encontraste un error o tienes una sugerencia? Describe el problema a continuacion. Tu feedback es muy valioso para nosotros.</p>
                    <div>
                        <label htmlFor="problemDescription" className="text-sm font-medium text-[var(--lh-text-secondary)]">Descripcion del Problema</label>
                        <textarea id="problemDescription" placeholder="Por favor, se lo mas detallado posible..." value={description} onChange={e => setDescription(e.target.value)} rows={5} className="mt-1 w-full p-2 border rounded-lg" required></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-[var(--lh-primary-action)] rounded-lg hover:bg-[var(--lh-text-secondary)] flex items-center gap-2">
                            <MessageSquareWarning size={16} /> Enviar Reporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};