// app/lib/SessionProvider.tsx

"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode,
  useMemo
} from 'react';
import { 
  useAccount, 
  useSignMessage, 
  useChainId, 
  useDisconnect, 
  useReadContract, 
  useWriteContract 
} from 'wagmi'; 
import { SiweMessage } from 'siwe';
import { resolveIpfsUrl } from './utils';
import { USER_PROFILE_CONTRACT_ADDRESS } from './contracts';

// --- ABI KONTRAK ---
export const userProfileAbi = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "EnforcedPause",
		"type": "error"
	},
	{
		"inputs": [],
		"name": "ExpectedPause",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "pause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Paused",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "newCID",
				"type": "string"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "updater",
				"type": "address"
			}
		],
		"name": "ProfileUpdated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "_cid",
				"type": "string"
			}
		],
		"name": "setProfileCID",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "_users",
				"type": "address[]"
			},
			{
				"internalType": "string[]",
				"name": "_cids",
				"type": "string[]"
			}
		],
		"name": "setProfileCIDBatch",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			},
			{
				"internalType": "string",
				"name": "_cid",
				"type": "string"
			}
		],
		"name": "setProfileCIDFor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "unpause",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "Unpaused",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_user",
				"type": "address"
			}
		],
		"name": "getProfileCID",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "paused",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

// --- Tipe Data ---
export interface ActivityItem { 
  id: string; 
  title: string; 
  url: string; 
}

export interface SocialLink {
  id: string;
  platform: string; 
  url: string;
}

export interface BlogPost {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null; 
  pendingCoverFile?: File | null; 
  content?: string; 
}

export interface Certificate {
  id: string;
  title: string;
  imageUrl?: string | null;
  pendingImageFile?: File | null;
  credentialUrl?: string; 
}

export interface Profile {
  name: string;
  bio: string;
  github: string;
  animation: string;
  projects: Project[];
  activity: {
    blogPosts: BlogPost[];      
    certificates: Certificate[]; 
    socialLinks: SocialLink[];   
    contactEmail?: string;    
    connectMsg?: string;  
  };
  imageUrl?: string | null;
  readmeUrl?: string | null;
  readmeName?: string | null;
  pendingImageFile?: File | null;
  pendingReadmeFile?: File | null;
}

export interface AnimationExtension { id: string; name: string; }

export interface Project {
  id: string;
  name: string;
  description: string;
  projectUrl?: string;
  tags: string[];
  isFeatured: boolean;
  gallery: string[];         // Array URL foto (Maks 7)
  videoUrl?: string | null;  // URL Video
  videoThumbnail?: string | null; // Cover Video

  // File Mentah untuk Upload (Local Draft)
  pendingGalleryFiles?: File[];
  pendingVideoFile?: File | null;
  pendingVideoThumbnailFile?: File | null;

  // Field Lama (untuk backward compatibility sementara)
  mediaPreview?: string | null;
  mediaIpfsUrl?: string | null;
}

// --- Tipe Konteks ---
interface SessionContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // Loading sesi
  isProfileLoading: boolean; // Loading data profil
  profile: Profile | null; 
  
  login: () => Promise<void>;
  logout: () => void;
  
  // Fungsi auto-save
  saveDraft: (dataToSave: Partial<Profile>) => void;
  
  // Status baru
  hasUnpublishedChanges: boolean;
  isPublishing: boolean;
  publishChangesToOnChain: () => Promise<void>;

  activeAnimation: string;
  setActiveAnimation: (anim: string) => Promise<void>;
  extensions: AnimationExtension[];
  addExtension: (url: string) => void;
  
  // Fungsi internal
  _setProfile: (profile: Profile | null) => void;
  _setIsProfileLoading: (loading: boolean) => void;
  isHydrated: boolean; 
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);
const IPFS_GATEWAY = 'https://gateway.pinata.cloud';

const DEFAULTS = {
  animation: 'dino',
  extensions: [] as AnimationExtension[],
  defaultProfile: {
    name: '',
    bio: '',
    github: '',
    animation: 'dino',
    projects: [],
    activity: {
      blogPosts: [],
      certificates: [],
      socialLinks: [],
      contactEmail: '',
    },
  } as Profile
};

const ProfileLoader = ({ children }: { children: ReactNode }) => {
  const { 
    _setProfile, 
    _setIsProfileLoading,
    isAuthenticated,
    isPublishing
  } = useAnimationStore();
  
  const { address } = useAccount();

  // Ambil data on-chain (lambat update)
  const { data: masterCID, isLoading: isReadingContract } = useReadContract({
    address: USER_PROFILE_CONTRACT_ADDRESS,
    abi: userProfileAbi,
    functionName: 'getProfileCID',
    args: [address as `0x${string}`],
    query: {
      enabled: !!address && isAuthenticated,
    },
  });

  useEffect(() => {
    const loadProfileData = async () => {
      _setIsProfileLoading(true);
      let loadedDraft: Profile | null = null;
      let serverProfile: Profile | null = null;

      // 1. COBA AMBIL DARI SERVER KV
      try {
        // [Caching Fix] Tambahkan { cache: 'no-store' }
        const res = await fetch('/api/user/profile', { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            serverProfile = data.profile;
            console.log("Loaded profile from KV");
          }
        }
      } catch (e) {
        console.error("KV Fetch error:", e);
      }

      // 2. JIKA SERVER KOSONG, BARU COBA BLOCKCHAIN (IPFS)
      if (!serverProfile && masterCID) {
        try {
          const ipfsUrl = `${IPFS_GATEWAY}/ipfs/${masterCID}`;
          const res = await fetch(ipfsUrl);
          if (res.ok) {
            serverProfile = await res.json();
            console.log("Loaded profile from IPFS (Blockchain)");
          }
        } catch (e) {
          console.warn("IPFS Fetch error:", e);
        }
      }

      // Jika masih kosong, pakai default
      const finalProfile = serverProfile || DEFAULTS.defaultProfile;
      
      // Simpan "Source of Truth" ke window untuk perbandingan "Unpublished Changes"
      (window as any).__onChainProfile = finalProfile;

      // 3. CEK DRAFT LOKAL (User sedang mengetik/edit)
      const localDraftJson = localStorage.getItem(`draftProfile_${address}`);
      if (localDraftJson) {
        console.log("Loaded local draft...");
        loadedDraft = JSON.parse(localDraftJson);
      } else {
        // Jika tidak ada draft, gunakan data yang baru kita load
        loadedDraft = finalProfile;
      }

      _setProfile(loadedDraft);
      _setIsProfileLoading(false);
    };

    if (isAuthenticated && !isPublishing) {
      loadProfileData();
    } else if (!isAuthenticated) {
      _setProfile(null);
      _setIsProfileLoading(false);
    }
  
  }, [isAuthenticated, masterCID, address, _setProfile, _setIsProfileLoading, isPublishing]);

  return <>{children}</>;
};

// --- PROVIDER UTAMA ---
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { address, chainId: wagmiChainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const chainId = wagmiChainId || 1;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  // 'profile' sekarang adalah DRAF LOKAL
  const [profile, setProfile] = useState<Profile | null>(null); 
  
  const [extensions, setExtensions] = useState<AnimationExtension[]>(() => {
    if (typeof window === 'undefined') return DEFAULTS.extensions;
    return JSON.parse(localStorage.getItem('animation_extensions') || '[]');
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // --- LOGIKA CEK SESI AWAL ---
  useEffect(() => {
    const checkSession = async () => {
      if (!address) {
        setIsAuthenticated(false);
        setProfile(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/profile');
        
        if (res.ok || res.status === 404) {
           setIsAuthenticated(true);
        } else {
           setIsAuthenticated(false);
           setProfile(null);
        }
      } catch (e) {
         setIsAuthenticated(false);
         setProfile(null);
      } finally {
        setIsLoading(false); 
      }
    };
    checkSession();
  }, [address]); 

  // --- Fungsi Login ---
  const login = useCallback(async () => {
    if (!address || !chainId) return;
    setIsLoading(true); 
    try {
      const nonceRes = await fetch('/api/siwe/nonce');
      const nonce = await nonceRes.text();
      const message = new SiweMessage({
        domain: window.location.host, address,
        statement: 'Sign in to Syafiq Dashboard',
        uri: window.location.origin, version: '1',
        chainId, nonce,
      });
      const signature = await signMessageAsync({ message: message.prepareMessage() });
      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.prepareMessage(), signature }),
      });
      if (!verifyRes.ok) throw new Error('Verification failed');
      
      setIsAuthenticated(true); 
      
    } catch (error) {
      console.error('Login failed:', error);
      setIsAuthenticated(false);
      setProfile(null);
    } finally {
      setIsLoading(false); 
    }
  }, [address, chainId, signMessageAsync]);

  // --- Fungsi Logout ---
  const logout = useCallback(async () => {
    if (address) {
      localStorage.removeItem(`draftProfile_${address}`);
    }
    setIsAuthenticated(false);
    setProfile(null); 
    try {
      await fetch('/api/siwe/logout'); 
    } catch (error) {
      console.error("Failed to clear session on server:", error);
    }
    disconnect();
  }, [disconnect, address]);

  // --- FUNGSI Simpan Draf (Auto-Save) ---
  const saveDraft = useCallback((dataToSave: Partial<Profile>) => {
    if (!isAuthenticated || !address) return;
    
    setProfile(prev => {
      const newDraft = { ...(prev as Profile), ...dataToSave };
      // Simpan ke localStorage secara otomatis
      localStorage.setItem(`draftProfile_${address}`, JSON.stringify(newDraft));
      return newDraft;
    });
  }, [isAuthenticated, address]);

  // --- Logika Animasi ---
  const setActiveAnimation = useCallback(async (newAnimation: string) => {
    saveDraft({ animation: newAnimation });
  }, [saveDraft]);
  const activeAnimation = profile?.animation || DEFAULTS.animation;
  const uploadFileToApi = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error /api/upload:", errorText);
      throw new Error(`Failed to upload file (${response.status}). Server: ${errorText}`);
    }
    const data = await response.json();
    return data.ipfsHash;
  };
  
  const uploadJsonToApi = async (data: object): Promise<string> => {
    const response = await fetch('/api/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error /api/upload-json:", errorText);
      throw new Error(`Failed to upload JSON (${response.status}). Server: ${errorText}`);
    }
    const result = await response.json();
    return result.ipfsHash;
  };

  const publishChangesToOnChain = useCallback(async () => {
    if (!profile || !address) return alert("Profile has not been loaded.");
    
    setIsPublishing(true);
    let dataToUpload = JSON.parse(JSON.stringify(profile)); 

    // --- FUNGSI HELPER Konversi data:url ke File ---
    const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return new File([blob], filename, { type: blob.type });
      } catch (e) {
        console.error("Failed to convert data:url to file:", e);
        return null;
      }
    };
    
    try {
      if (dataToUpload.imageUrl && dataToUpload.imageUrl.startsWith('data:')) {
        const file = await dataUrlToFile(dataToUpload.imageUrl, "profile-image");
        if(file) dataToUpload.imageUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      if (dataToUpload.readmeUrl && dataToUpload.readmeUrl.startsWith('data:')) {
        const file = await dataUrlToFile(dataToUpload.readmeUrl, dataToUpload.readmeName || "README.md");
        if(file) dataToUpload.readmeUrl = `ipfs://${await uploadFileToApi(file)}`;
      }

      if (dataToUpload.activity?.blogPosts) {
        for (const post of dataToUpload.activity.blogPosts) {
          if (post.coverImage && post.coverImage.startsWith('data:')) {
            const file = await dataUrlToFile(post.coverImage, post.title || "blog-cover");
            if (file) {
              post.coverImage = `ipfs://${await uploadFileToApi(file)}`;
            }
          }
          delete post.pendingCoverFile; // Bersihkan file mentah
        }
      }

      if (dataToUpload.activity?.certificates) {
        for (const cert of dataToUpload.activity.certificates) {
          if (cert.imageUrl && cert.imageUrl.startsWith('data:')) {
            const file = await dataUrlToFile(cert.imageUrl, cert.title || "certificate-img");
            if (file) {
              cert.imageUrl = `ipfs://${await uploadFileToApi(file)}`;
            }
          }
          delete cert.pendingImageFile;
        }
      }

      for (const project of dataToUpload.projects) {
        if (project.mediaPreview && project.mediaPreview.startsWith('data:')) {
          const file = await dataUrlToFile(project.mediaPreview, project.name || "project-media");
          if (file) {
            project.mediaIpfsUrl = `ipfs://${await uploadFileToApi(file)}`;
            project.mediaPreview = null; // Hapus data:url yang besar
          }
        }
      }
      
      delete dataToUpload.pendingImageFile;
      delete dataToUpload.pendingReadmeFile;
      for (const project of dataToUpload.projects) {
        delete project.pendingMediaFile;
      }
      
      // 1. Upload Master JSON ke IPFS
      const masterCID = await uploadJsonToApi(dataToUpload);
      console.log("Master CID didapat:", masterCID);

      // 2. COBA PUBLISH VIA GASLESS (RAG SYSTEM)
      let txHash = "";
      let isGaslessSuccess = false;

      try {
        const gaslessResponse = await fetch('/api/user/publish-gasless', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            newCid: masterCID
          }),
        });

        const gaslessResult = await gaslessResponse.json();

        if (gaslessResponse.status === 402) {
           // TANGKAP KONDISI SALDO HABIS
           throw new Error("RAG_INSUFFICIENT_FUNDS");
        }

        if (!gaslessResponse.ok) {
           throw new Error(gaslessResult.error || "Gasless API Error");
        }

        // Jika sukses gasless
        txHash = gaslessResult.txHash;
        isGaslessSuccess = true;
        alert(`Sukses! Update via Gasless RAG.\nSisa Budget: ${gaslessResult.remainingBudget} ETH`);

      } catch (gaslessError: any) {
        // 3. LOGIKA FALLBACK (JIKA GASLESS GAGAL)
        
        if (gaslessError.message === "RAG_INSUFFICIENT_FUNDS") {
           // Beritahu user
           const proceedManual = confirm(
             "⚠️ Saldo RAG/Budget Anda habis.\n\nSistem akan beralih menggunakan Wallet pribadi Anda (Gas berbayar).\nLanjutkan?"
           );

           if (!proceedManual) {
             setIsPublishing(false);
             return; // User membatalkan
           }

           // Eksekusi Manual (Fallback)
           console.log("Switching to manual wallet execution...");
           txHash = await writeContractAsync({
              address: USER_PROFILE_CONTRACT_ADDRESS,
              abi: userProfileAbi,
              functionName: 'setProfileCID',
              args: [masterCID],
           });
           
           alert("Sukses! Profil diperbarui menggunakan Wallet Pribadi.");

        } else {
           // Jika errornya bukan karena saldo (misal server down), tetap lempar error
           throw gaslessError;
        }
      }

      // 4. Update Database Lokal (Vercel KV) agar sinkron
      // Langkah ini dijalankan baik via Gasless maupun Manual
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpload),
      });

      // 5. Finalisasi State
      setProfile(dataToUpload); 
      localStorage.removeItem(`draftProfile_${address}`);
      (window as any).__onChainProfile = dataToUpload;

    } catch (error: any) {
      console.error("Failed to publish:", error);
      alert(`Gagal mempublikasikan profil: ${error.message}`);
    } finally {
      setIsPublishing(false);
    }
  }, [profile, address, writeContractAsync]);

  // --- Cek Perubahan ---
  const hasUnpublishedChanges = useMemo(() => {
    // Jangan bandingkan jika salah satu belum terdefinisi
    if (!profile || !(window as any).__onChainProfile) return false;
    
    // Bandingkan draf saat ini dengan data on-chain yang disimpan di window
    const draftJson = JSON.stringify(profile);
    const onChainJson = JSON.stringify((window as any).__onChainProfile);
    
    return draftJson !== onChainJson;
    
  }, [profile]);

  const addExtension = (repoUrl: string) => {
    const newExtension: AnimationExtension = {
      id: repoUrl,
      name: repoUrl.split('/').pop() || 'Custom Animation',
    };
    setExtensions((prev) => {
      const newList = [...prev, newExtension];
      localStorage.setItem('animation_extensions', JSON.stringify(newList));
      return newList;
    });
  };

  const value = {
    isAuthenticated,
    isLoading,
    isProfileLoading,
    profile, 
    login,
    logout,
    saveDraft, 
    activeAnimation, 
    setActiveAnimation,
    extensions,
    addExtension,
    isHydrated: !isLoading && !isProfileLoading, 
    isPublishing,
    publishChangesToOnChain,
    hasUnpublishedChanges, 

    // Fungsi internal
    _setProfile: setProfile,
    _setIsProfileLoading: setIsProfileLoading,
  };

  return (
    <SessionContext.Provider value={value}>
      <ProfileLoader>
        {children}
      </ProfileLoader>
    </SessionContext.Provider>
  );
};

// Hook kustom 
export const useAnimationStore = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useAnimationStore harus digunakan di dalam SessionProvider');
  }
  return context;
};