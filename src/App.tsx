import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type GameSave, type Player } from './db';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSun,
  faMoon,
  faLeaf,
  faFloppyDisk,
  faChevronLeft,
  faEdit,
  faShareNodes,
  faUsers,
  faListCheck,
  faDice,
  faCamera,
  faPalette,
  faBarsProgress,
  faHashtag,
  faPlus,
  faArrowDownWideShort,
  faDownload,
  faUpload,
  faImages,
  faCopy,
  faCircleCheck,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faWhatsapp, faTelegram } from '@fortawesome/free-brands-svg-icons';
 // @ts-ignore 
import JSZip from 'jszip';

/* ── THEME-AWARE PALETTES ── */
const PALETTE_DARK = ['#FB923C', '#FBBF24', '#F87171', '#F472B6', '#C084FC', '#818CF8', '#2DD4BF', '#4ADE80', '#A3E635', '#94A3B8', '#38BDF8', '#E879F9', '#FB7185', '#A8A29E'];
const PALETTE_LIGHT = ['#C2410C', '#B45309', '#B91C1C', '#BE185D', '#7E22CE', '#4338CA', '#0F766E', '#15803D', '#4D7C0F', '#334155', '#0369A1', '#A21CAF', '#BE123C', '#44403C'];

const COLOR_INDEX_MAP = new Map<string, number>();
PALETTE_DARK.forEach((hex, i) => COLOR_INDEX_MAP.set(hex.toLowerCase(), i));
PALETTE_LIGHT.forEach((hex, i) => COLOR_INDEX_MAP.set(hex.toLowerCase(), i));

const getColorIndex = (hex: string): number => {
  if (!hex) return 0;
  return COLOR_INDEX_MAP.get(hex.toLowerCase()) ?? 0;
};

const getPatternIndex = (hex: string): number => getColorIndex(hex) + 1;

interface GameSuggestion {
  n: string;
  cat: 'Boardgame' | 'RPG';
}

const RPG_SET = new Set([
  '7th Sea', 'Advanced Dungeons & Dragons (1st Edition)', 'Advanced Dungeons & Dragons (2nd Edition)',
  'ALIEN: The Roleplaying Game', 'Amber Diceless Role-Playing', 'Apocalypse World', 'Ars Magica (3rd Edition)',
  'Ars Magica (4th Edition)', 'Ars Magica (5th Edition)', 'Basic Dungeons & Dragons', 'Basic Fantasy Role-Playing Game',
  'Basic Roleplaying', 'Blades in the Dark', 'Brindlewood Bay', 'Call of Cthulhu (1st Edition)',
  'Call of Cthulhu (2nd - 6th Edition)', 'Call of Cthulhu (7th Edition)', 'Castle Falkenstein', 'Changeling: The Lost',
  'Cheat Your Own Adventure', 'Cyberpunk 2020', 'Dark Heresy (1st Edition)', 'Deadlands (2nd Revised Edition)',
  'Deadlands (Original Edition)', 'Deadlands: Reloaded', 'Delta Green: The Role-Playing Game', 'Diaspora',
  'Doctor Who Roleplaying Game', 'Dogs in the Vineyard', "Don't Rest Your Head", 'Dragon Age', 'Dread',
  'Dungeon Crawl Classics Role Playing Game', 'Dungeon World', 'Dungeons & Dragons (3.5 Edition)',
  'Dungeons & Dragons (3rd Edition)', 'Dungeons & Dragons (4th Edition)', 'Dungeons & Dragons (5th Edition)',
  'Dungeons & Dragons (Original Edition)', 'Earthdawn (1st Edition)', 'Eclipse Phase (First Edition)', 'Fate Core',
  'Fiasco Classic', 'Forbidden Lands', 'GURPS (3rd Edition)', 'GURPS (4th Edition)', 'HERO System (5th Edition)',
  'InSpectres', 'Ironsworn', 'Kult (1st Edition)', 'Lady Blackbird', 'Legend of the Five Rings (1st Edition)',
  'Legend of the Five Rings (3rd Edition)', 'Legend of the Five Rings (4th Edition)', 'Mage: The Ascension',
  'Mage: The Awakening', 'Marvel Heroic Roleplaying', 'Marvel Super Heroes', 'Masks: A New Generation',
  'Microscope', 'Middle-earth Role Playing (1st & 2nd Editions)', 'Monster of the Week',
  'Monsterhearts (1st & 2nd Eds.)', 'Mothership', 'Mouse Guard', 'Mutant: Year Zero',
  'Mutants & Masterminds Second Edition', 'Mythras', 'MÖRK BORG', "Night's Black Agents", 'Nobilis',
  'Numenera', 'Old-School Essentials Retro Adventure Game', 'Paranoia (1st Edition)', 'Paranoia (2nd Edition)',
  'Paranoia (Mongoose Edition)', 'Pathfinder Roleplaying Game (1st Edition)', 'Pathfinder Roleplaying Game (2nd Edition)',
  'Pendragon (1st–6th Editions)', 'Polaris: Chivalric Tragedy at Utmost North', 'Primetime Adventures (1st, 2nd & 3rd Editions)',
  'Rifts', 'Rogue Trader', 'Rolemaster (1st, 2nd & Classic Editions)', 'RPG Geek - Mountains of Madness',
  'RuneQuest (1st & 2nd Editions)', 'RuneQuest (3rd Edition)', 'RuneQuest: Roleplaying in Glorantha',
  'Savage Worlds Adventure Edition (SWADE)', 'Savage Worlds Deluxe Edition (SWD)', 'Serenity Role Playing Game',
  'Shadow of the Demon Lord', 'Shadowrun (1st Edition)', 'Shadowrun (2nd Edition)', 'Shadowrun (3rd Edition)',
  'Shadowrun (4th Edition)', 'Shadowrun (5th Edition)', 'Spirit of the Century', 'Star Trek Adventures',
  'Star Wars (Saga)', 'Star Wars (WEG 2nd Edition)', 'Star Wars (WEG Original Edition)', 'Star Wars: Age of Rebellion',
  'Star Wars: Edge of the Empire', 'Star Wars: Force and Destiny', 'Stormbringer (1st, 2nd & 3rd Editions)',
  'Symbaroum', 'Tales from the Loop', 'The Burning Wheel (Revised Edition)', 'The Burning Wheel Gold',
  'The Dresden Files Roleplaying Game', 'The One Ring (1st Edition)', 'The One Ring (2nd Edition)',
  'The Quiet Year', 'The World of Darkness', 'Toon', 'Trail of Cthulhu', 'Traveller (Classic)',
  'Traveller (Mongoose 2nd Edition)', 'Traveller (Mongoose)', 'Twilight: 2000 (1st Edition)',
  'Unknown Armies (2nd Edition)', 'Urban Shadows', 'Vaesen', 'Vampire: The Dark Ages', 'Vampire: The Masquerade',
  'Vampire: The Masquerade (5th Edition)', 'Vampire: The Requiem', 'Warhammer Fantasy Roleplay (1st Edition)',
  'Warhammer Fantasy Roleplay (2nd Edition)', 'Warhammer Fantasy Roleplay (3rd Edition)', 'Werewolf: The Apocalypse'
]);

const ALL_GAMES_LIST = [
  '7 Wonders', '7 Wonders Duel', '7th Sea', 'A Feast for Odin', 'A Game of Thrones: The Board Game (Second Edition)',
  'Advanced Dungeons & Dragons (1st Edition)', 'Advanced Dungeons & Dragons (2nd Edition)', 'Age of Innovation',
  'Agricola', 'Agricola (Revised Edition)', 'Alhambra', 'ALIEN: The Roleplaying Game', 'Amber Diceless Role-Playing',
  'Anachrony', 'Android: Netrunner', 'Apocalypse World', 'Ark Nova', 'Arkham Horror', 'Arkham Horror: The Card Game',
  'Ars Magica (3rd Edition)', 'Ars Magica (4th Edition)', 'Ars Magica (5th Edition)', 'Azul', 'Barrage',
  'Basic Dungeons & Dragons', 'Basic Fantasy Role-Playing Game', 'Basic Roleplaying', 'Battlestar Galactica: The Board Game',
  'Betrayal at House on the Hill', 'Blades in the Dark', 'Blood on the Clocktower', 'Blood Rage', 'Bohnanza',
  'Bomb Busters', 'Brass: Birmingham', 'Brass: Lancashire', 'Brindlewood Bay', 'Call of Cthulhu (1st Edition)',
  'Call of Cthulhu (2nd - 6th Edition)', 'Call of Cthulhu (7th Edition)', 'Carcassonne', 'Cartographers', 'Cascadia',
  'Castle Falkenstein', 'Catan', 'Caverna: The Cave Farmers', 'Changeling: The Lost', 'Cheat Your Own Adventure', 'Chess',
  'Citadels', 'Clank! Legacy: Acquisitions Incorporated', 'Clank!: A Deck-Building Adventure', 'Clank!: Catacombs',
  'Clans of Caledonia', 'Codenames', 'Colt Express', 'Concordia', 'Cosmic Encounter', 'Coup', 'Crokinole',
  'Cthulhu: Death May Die', 'Cyberpunk 2020', 'Dark Heresy (1st Edition)', "Darwin's Journey",
  'Dead of Winter: A Crossroads Game', 'Deadlands (2nd Revised Edition)', 'Deadlands (Original Edition)',
  'Deadlands: Reloaded', 'Delta Green: The Role-Playing Game', 'Diaspora', 'Dixit', 'Doctor Who Roleplaying Game',
  'Dogs in the Vineyard', 'Dominion', "Don't Rest Your Head", 'Dragon Age', 'Dread', 'Dune: Imperium',
  'Dune: Imperium – Uprising', 'Dungeon Crawl Classics Role Playing Game', 'Dungeon World', 'Dungeons & Dragons (3.5 Edition)',
  'Dungeons & Dragons (3rd Edition)', 'Dungeons & Dragons (4th Edition)', 'Dungeons & Dragons (5th Edition)',
  'Dungeons & Dragons (Original Edition)', 'Earthdawn (1st Edition)', 'Eclipse Phase (First Edition)',
  'Eclipse: Second Dawn for the Galaxy', 'El Grande', 'Eldritch Horror', 'Endeavor: Deep Sea', 'Everdell',
  'Exploding Kittens', 'Fate Core', 'Fiasco Classic', 'Final Girl', 'Five Tribes: The Djinns of Naqala',
  'Food Chain Magnate', 'Forbidden Island', 'Forbidden Lands', 'Frosthaven', 'Gaia Project', 'Galaxy Trucker',
  'Gloomhaven', 'Gloomhaven: Jaws of the Lion', 'Grand Austria Hotel', 'Great Western Trail',
  'Great Western Trail: New Zealand', 'Great Western Trail: Second Edition', 'GURPS (3rd Edition)', 'GURPS (4th Edition)',
  'Hanabi', 'Harmonies', 'Heat: Pedal to the Metal', 'Hegemony: Lead Your Class to Victory', 'HERO System (5th Edition)',
  'Hive', 'InSpectres', 'Ironsworn', 'Jaipur', 'Just One', 'Kanban EV', 'King of Tokyo', 'Kingdom Death: Monster',
  'Kingdomino', 'Kult (1st Edition)', 'Lady Blackbird', 'Le Havre', 'Legend of the Five Rings (1st Edition)',
  'Legend of the Five Rings (3rd Edition)', 'Legend of the Five Rings (4th Edition)', 'Lisboa', 'Lords of Waterdeep',
  'Lost Cities', 'Lost Ruins of Arnak', 'Love Letter', 'Machi Koro', 'Mage Knight Board Game', 'Mage: The Ascension',
  'Mage: The Awakening', 'Magic: The Gathering', 'Mansions of Madness: Second Edition', 'Maracaibo',
  'Marvel Champions: The Card Game', 'Marvel Heroic Roleplaying', 'Marvel Super Heroes', 'Masks: A New Generation',
  'Mechs vs. Minions', 'Microscope', 'Middle-earth Role Playing (1st & 2nd Editions)', 'Monopoly', 'Monster of the Week',
  'Monsterhearts (1st & 2nd Eds.)', 'Mothership', 'Mouse Guard', 'Munchkin', 'Mutant: Year Zero',
  'Mutants & Masterminds Second Edition', 'Mysterium', 'Mythras', 'MÖRK BORG', 'Nemesis', "Night's Black Agents",
  'Nobilis', 'Numenera', 'Oathsworn: Into the Deepwood', 'Obsession', 'Old-School Essentials Retro Adventure Game',
  'On Mars', 'Orléans', 'Paladins of the West Kingdom', 'Pandemic', 'Pandemic Legacy: Season 0',
  'Pandemic Legacy: Season 1', 'Pandemic Legacy: Season 2', 'Paranoia (1st Edition)', 'Paranoia (2nd Edition)',
  'Paranoia (Mongoose Edition)', 'Patchwork', 'Pathfinder Roleplaying Game (1st Edition)',
  'Pathfinder Roleplaying Game (2nd Edition)', 'Pax Pamir: Second Edition', 'Pendragon (1st–6th Editions)',
  'Polaris: Chivalric Tragedy at Utmost North', 'Power Grid', 'Primetime Adventures (1st, 2nd & 3rd Editions)',
  'Puerto Rico', 'Quacks', 'Race for the Galaxy', 'Revive', 'Rifts', 'Risk',
  'Robinson Crusoe: Adventures on the Cursed Island', 'Rogue Trader', 'Rolemaster (1st, 2nd & Classic Editions)',
  'Root', 'RPG Geek - Mountains of Madness', 'RuneQuest (1st & 2nd Editions)', 'RuneQuest (3rd Edition)',
  'RuneQuest: Roleplaying in Glorantha', 'Saboteur', 'Sagrada', 'Santorini',
  'Savage Worlds Adventure Edition (SWADE)', 'Savage Worlds Deluxe Edition (SWD)', 'Scrabble', 'Scythe', 'Secret Hitler',
  'Serenity Role Playing Game', 'SETI: Search for Extraterrestrial Intelligence', 'Shadow of the Demon Lord',
  'Shadowrun (1st Edition)', 'Shadowrun (2nd Edition)', 'Shadowrun (3rd Edition)', 'Shadowrun (4th Edition)',
  'Shadowrun (5th Edition)', 'Sheriff of Nottingham', 'Sky Team', 'Slay the Spire: The Board Game', 'Sleeping Gods',
  'Small World', 'Spirit Island', 'Spirit of the Century', 'Splendor', 'Star Realms', 'Star Trek Adventures',
  'Star Wars (Saga)', 'Star Wars (WEG 2nd Edition)', 'Star Wars (WEG Original Edition)', 'Star Wars: Age of Rebellion',
  'Star Wars: Edge of the Empire', 'Star Wars: Force and Destiny', 'Star Wars: Imperial Assault', 'Star Wars: Rebellion',
  'Stone Age', 'Stormbringer (1st, 2nd & 3rd Editions)', 'Sushi Go Party!', 'Sushi Go!', 'Symbaroum', 'Takenoko',
  'Tales from the Loop', 'Terra Mystica', 'Terraforming Mars', 'The Burning Wheel (Revised Edition)', 'The Burning Wheel Gold',
  'The Castles of Burgundy', 'The Crew: Mission Deep Sea', 'The Crew: The Quest for Planet Nine',
  'The Dresden Files Roleplaying Game', 'The Gallerist', 'The Lord of the Rings: Duel for Middle-earth',
  'The Lord of the Rings: Fate of the Fellowship', 'The Mind', 'The One Ring (1st Edition)', 'The One Ring (2nd Edition)',
  'The Quiet Year', 'The Resistance', 'The Resistance: Avalon', 'The White Castle', 'The World of Darkness',
  'Through the Ages: A New Story of Civilization', 'Ticket to Ride', 'Ticket to Ride Legacy: Legends of the West',
  'Ticket to Ride: Europe', 'Too Many Bones', 'Toon', 'Trail of Cthulhu', 'Traveller (Classic)',
  'Traveller (Mongoose 2nd Edition)', 'Traveller (Mongoose)', 'Twilight Imperium: Fourth Edition', 'Twilight Struggle',
  'Twilight: 2000 (1st Edition)', "Tzolk'in: The Mayan Calendar", 'Underwater Cities', 'Unknown Armies (2nd Edition)',
  'Urban Shadows', 'Vaesen', 'Vampire: The Dark Ages', 'Vampire: The Masquerade', 'Vampire: The Masquerade (5th Edition)',
  'Vampire: The Requiem', 'Viticulture Essential Edition', 'Voidfall', 'War of the Ring: Second Edition',
  'Warhammer Fantasy Roleplay (1st Edition)', 'Warhammer Fantasy Roleplay (2nd Edition)',
  'Warhammer Fantasy Roleplay (3rd Edition)', 'Welcome To...', 'Werewolf: The Apocalypse', 'Wingspan', 'Wingspan Asia'
];

const SUGGESTIONS: GameSuggestion[] = ALL_GAMES_LIST.map(name => ({
  n: name,
  cat: RPG_SET.has(name) ? 'RPG' : 'Boardgame'
}));

const SAMPLE_GAMES: GameSave[] = [
  {
    id: 'hq', name: 'HeroQuest', scenario: "Kellar's Keep · Quest 7",
    color: PALETTE_DARK[0], hasPhoto: false,
    lastModified: Date.now() - 23 * 86400000,
    next: "Explore the secret door in Room 14. Barbarian needs a healing potion first.",
    round: 14, npid: 1,
    players: [
      { id: 1, name: 'Barbarian', note: 'Has Spirit Blade.', stats: [{ id: 11, type: 'hp', label: 'HP', value: 6, max: 8, color: '#F87171' }] },
      { id: 2, name: 'Elf', note: '', stats: [{ id: 21, type: 'hp', label: 'HP', value: 4, max: 6, color: '#F87171' }] },
      { id: 3, name: 'Wizard', note: 'Used last potion.', stats: [{ id: 31, type: 'hp', label: 'HP', value: 3, max: 6, color: '#F87171' }] }
    ],
    cl: ['Restore Barbarian to 6/8 HP', 'Restore Elf to 4/6 HP', 'Restore Wizard to 3/6 HP', 'Give Barbarian Spirit Blade', 'Continue from Room 14']
  },
  {
    id: 'ws', name: 'Wingspan', scenario: 'Round 3',
    color: PALETTE_DARK[6], hasPhoto: false,
    lastModified: Date.now() - 6 * 86400000,
    next: "Round 3. Alex leads on eggs. Watch Sara's predator chain.",
    round: 3, npid: 2,
    players: [
      { id: 1, name: 'Alex', note: '7 eggs cached.', stats: [{ id: 11, type: 'num', label: 'Score', value: 54, color: '#F59E0B' }] },
      { id: 2, name: 'Sara', note: 'Predator chain ready.', stats: [{ id: 21, type: 'num', label: 'Score', value: 61, color: '#14B8A6' }] }
    ],
    cl: ['Deal 2 bird tray cards', 'Reset bird feeder', "Sara's turn first"]
  }
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [screen, setScreenState] = useState<'home' | 'resume' | 'form' | 'about'>('home');
  const [sortMode, setSortMode] = useState<'date' | 'name'>('date');
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ icon: React.ReactNode; msg: string } | null>(null);
  
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [shareData, setShareData] = useState<{
    text: string;
    photo?: string;
    title: string;
    save: GameSave;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [gameName, setGameName] = useState('');
  const [scenario, setScenario] = useState('');
  const [nextIntentions, setNextIntentions] = useState('');
  const [formColor, setFormColor] = useState(PALETTE_DARK[5]);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoData, setPhotoData] = useState<string | undefined>(undefined);
  const [round, setRound] = useState(1);
  const [nextPlayerId, setNextPlayerId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showPlayersExp, setShowPlayersExp] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const [clCompleted, setClCompleted] = useState<Record<number, boolean>>({});
  const [ddStyle, setDdStyle] = useState<React.CSSProperties>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const checklistRef = useRef<HTMLDivElement>(null);
  const gameNameInputRef = useRef<HTMLInputElement>(null);

  const PALETTE = darkMode ? PALETTE_DARK : PALETTE_LIGHT;
  const resolveColor = (hex: string) => PALETTE[getColorIndex(hex)];

  const showToastMsg = (icon: React.ReactNode, msg: string) => {
    setToast({ icon, msg });
  };

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch {
      try {
        const parts = dataUrl.split(',');
        if (parts.length < 2) return null;
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new File([u8arr], filename, { type: mime });
      } catch {
        return null;
      }
    }
  };

  // Visual Viewport listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportChange = () => {
      const vv = window.visualViewport!;
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      document.documentElement.style.setProperty(
        '--visual-viewport-bottom',
        `${Math.max(0, offset)}px`
      );
    };

    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  // Smooth scroll Game Name field with 70px clearance for fixed header/nav bar
  const scrollToGameNameInput = () => {
    if (gameNameInputRef.current) {
      const rect = gameNameInputRef.current.getBoundingClientRect();
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      const targetY = Math.max(0, rect.top + currentScrollY - 70);
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  // Update fixed dropdown position on scroll, resize or input edit
  const updateDropdownPosition = () => {
    if (gameNameInputRef.current) {
      const rect = gameNameInputRef.current.getBoundingClientRect();
      setDdStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
        maxHeight: '40vh',
        overflowY: 'auto',
      });
    }
  };

  useEffect(() => {
    if (!ddOpen) return;
    updateDropdownPosition();
    window.addEventListener('scroll', updateDropdownPosition, true);
    window.addEventListener('resize', updateDropdownPosition);
    return () => {
      window.removeEventListener('scroll', updateDropdownPosition, true);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [ddOpen, gameName]);

  const saves: GameSave[] = useLiveQuery(async () => {
    const items = await db.saves.toArray();
    return items.map(item => ({
      id: item.id,
      name: item.name,
      scenario: item.scenario,
      color: item.color,
      hasPhoto: item.hasPhoto,
      photo: item.photo,
      lastModified: item.lastModified,
      next: item.next,
      round: item.round,
      npid: item.npid ?? null,
      players: item.players || [],
      cl: item.cl || []
    }));
  }) || [];

  const setScreen = (s: 'home' | 'resume' | 'form' | 'about', push = true) => {
    if (push) {
      try { window.history.pushState({ screen: s }, ''); } catch { /* ignore */ }
    }
    setScreenState(s);
  };

  // Router
  useEffect(() => {
    const handleHashRouting = async () => {
      let hash = window.location.hash;

      if (hash.startsWith('#/save/')) {
        const saveId = hash.replace('#/save/', '');
        setSelectedSaveId(saveId);
        setScreenState('resume');
      } else {
        try { window.history.replaceState({ screen: 'home' }, '', '/'); } catch { /* ignore */ }
      }
    };

    handleHashRouting();

    const onPop = (e: PopStateEvent) => setScreenState(e.state?.screen ?? 'home');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    db.saves.count().then(n => {
      if (n === 0) SAMPLE_GAMES.forEach(g => db.saves.add(g));
    });
  }, []);

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (showChecklist) {
      requestAnimationFrame(() => {
        checklistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [showChecklist]);

  useEffect(() => {
    const anyModalOpen = !!(deleteConfirmId || showPhotoModal || shareData || fullscreenImage);
    if (!anyModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setDeleteConfirmId(null);
      setShowPhotoModal(false);
      setShareData(null);
      setFullscreenImage(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteConfirmId, showPhotoModal, shareData, fullscreenImage]);

  const timeAgo = (ts: number) => {
    const elapsedMs = Date.now() - ts;
    const minutes = Math.floor(elapsedMs / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const sortedSaves = useMemo(
    () => [...saves].sort((a, b) =>
      sortMode === 'name' ? a.name.localeCompare(b.name) : b.lastModified - a.lastModified
    ),
    [saves, sortMode]
  );

  const selectedSave = useMemo(
    () => saves.find(s => s.id === selectedSaveId),
    [saves, selectedSaveId]
  );

  const autoChecklist = useMemo(() => {
    if (!selectedSave) return [];
    const list: React.ReactNode[] = [];

    selectedSave.players.forEach(p => {
      p.stats.filter(s => s.type === 'hp').forEach(hp => {
        list.push(
          <>
            <strong>Restore</strong> {p.name} to <code>{hp.value}/{hp.max}</code> {hp.label}
          </>
        );
      });

      if (p.note) {
        list.push(
          <>
            <strong>Note</strong> for {p.name}: "{p.note}"
          </>
        );
      }
    });

    if (selectedSave.round > 0) {
      list.push(
        <>
          <strong>Set</strong> Round counter to <code>{selectedSave.round}</code>
        </>
      );
    }

    if (selectedSave.next && selectedSave.next.trim()) {
      list.push(
        <>
          <strong>Read</strong>: "{selectedSave.next}"
        </>
      );
    }

    return list.length ? list : selectedSave.cl;
  }, [selectedSave]);

  // Clean textual share formatting with WhatsApp/Telegram markdown (no URLs)
  const handleShare = (save: GameSave) => {
    const playerLines = save.players.map(p => {
      const isNext = save.npid === p.id;
      const stats = p.stats.map(s =>
        s.type === 'hp'
          ? `${s.label}: *${s.value}/${s.max}*`
          : `${s.label}: *${s.value}*`
      ).join(', ');
      const note = p.note ? ` (*${p.note}*)` : '';
      return `• *${p.name}*${isNext ? ' ⏭️' : ''}${stats ? ' — ' + stats : ''}${note}`;
    }).join('\n');

    const nextPlayer = save.npid
      ? save.players.find(p => p.id === save.npid)?.name
      : null;

    const lines: (string | null)[] = [
      `🎲 *${save.name}*`,
      save.scenario ? `*${save.scenario}*` : null,
      '',
      save.next?.trim() ? `📍 *What's Next*\n${save.next.trim()}` : null,
      playerLines ? `\n👥 *Party & Scores*\n${playerLines}` : null,
      (save.round > 0 || nextPlayer)
        ? [
            '\n',
            save.round > 0 ? `🔄 Round *${save.round}*` : null,
            nextPlayer ? `⏭️ Next up: *${nextPlayer}*` : null
          ].filter(Boolean).join('   ')
        : null,
      '',
      '*Saved with PackAway 🎲*'
    ];

    const text = lines.filter(l => l !== null).join('\n');

    setShareData({
      text,
      photo: save.photo,
      title: save.name,
      save
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhotoData(canvas.toDataURL('image/jpeg', 0.75));
          setHasPhoto(true);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openNewForm = () => {
    setEditingId(null); setGameName(''); setScenario('');
    setNextIntentions(''); setFormColor(PALETTE[5]);
    setHasPhoto(false); setPhotoData(undefined);
    setRound(1); setNextPlayerId(null);
    setPlayers([]);
    setShowPlayersExp(true);
    setScreen('form');
  };

  const openEditForm = (save: GameSave) => {
    setEditingId(save.id); setGameName(save.name);
    setScenario(save.scenario || ''); setNextIntentions(save.next);
    setFormColor(resolveColor(save.color)); setHasPhoto(save.hasPhoto);
    setPhotoData(save.photo); setRound(save.round);
    setNextPlayerId(save.npid ?? null);
    setPlayers(JSON.parse(JSON.stringify(save.players)));
    setShowPlayersExp(true);
    setScreen('form');
  };

  // Fixed Save/Update handler: redirects to Home, prevents double-submits and displays Toast
  const handleSaveForm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isEdit = Boolean(editingId);
      const id = editingId || `save_${Date.now()}`;
      await db.saves.put({
        id,
        name: gameName.trim() || 'Untitled Game',
        scenario: scenario.trim(),
        color: formColor,
        hasPhoto,
        photo: photoData,
        lastModified: Date.now(),
        next: nextIntentions.trim(),
        round,
        npid: nextPlayerId,
        players,
        cl: ['Review table photo', 'Restore all player stats', "Read 'What's Next'"]
      });
      setEditingId(null);
      setSelectedSaveId(null);
      goToHome();
      showToastMsg(
        <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />,
        isEdit ? 'Save point updated!' : 'Game save created!'
      );
    } catch {
      showToastMsg(<FontAwesomeIcon icon={faXmark} aria-hidden="true" />, 'Could not save game.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatValue = (pIdx: number, sIdx: number, key: 'value' | 'max', delta: number) => {
    const copy = [...players];
    const s = copy[pIdx].stats[sIdx];
    if (key === 'value') s.value = Math.max(0, s.value + delta);
    else if (key === 'max' && s.max !== undefined) s.max = Math.max(1, s.max + delta);
    setPlayers(copy);
  };

  const setDirectStatValue = (pIdx: number, sIdx: number, key: 'value' | 'max', val: number) => {
    const copy = [...players];
    const s = copy[pIdx].stats[sIdx];
    if (key === 'value') s.value = Math.max(0, val);
    else if (key === 'max' && s.max !== undefined) s.max = Math.max(1, val);
    setPlayers(copy);
  };

  const updateStatLabel = (pIdx: number, sIdx: number, label: string) => {
    const copy = [...players];
    copy[pIdx].stats[sIdx].label = label;
    setPlayers(copy);
  };

  const deleteStat = (pIdx: number, sIdx: number) => {
    const copy = [...players];
    copy[pIdx].stats.splice(sIdx, 1);
    setPlayers(copy);
  };

  const deletePlayer = (pIdx: number) => {
    const removedId = players[pIdx].id;
    setPlayers(players.filter((_, i) => i !== pIdx));
    if (nextPlayerId === removedId) setNextPlayerId(null);
  };

  // ZIP Backup Export (saves.json + JPEG photos in photos/ folder)
  const exportBackup = async () => {
    try {
      const zip = new JSZip();
      const cleanSaves = saves.map(s => ({
        ...s,
        photo: undefined,
        hasPhoto: Boolean(s.photo)
      }));

      zip.file('saves.json', JSON.stringify({
        version: 2,
        app: 'PackAway',
        exported: new Date().toISOString(),
        saves: cleanSaves
      }, null, 2));

      const photosFolder = zip.folder('photos');
      saves.forEach(s => {
        if (s.photo) {
          const parts = s.photo.split(',');
          if (parts.length >= 2) {
            photosFolder?.file(`${s.id}.jpg`, parts[1], { base64: true });
          }
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `packaway-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      showToastMsg(<FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />, `Exported ${saves.length} save(s) to ZIP`);
    } catch {
      showToastMsg(<FontAwesomeIcon icon={faXmark} aria-hidden="true" />, 'Could not create ZIP backup');
    }
  };

  // Backward-compatible Import (supports both .zip and legacy .json files)
  const importBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let importedSaves: GameSave[] = [];

      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const jsonFile = zip.file('saves.json');
        if (!jsonFile) {
          alert('Invalid ZIP backup: missing saves.json');
          return;
        }
        const jsonText = await jsonFile.async('text');
        const parsed = JSON.parse(jsonText);
        const rawSaves: GameSave[] = parsed.saves || [];

        for (const s of rawSaves) {
          let photoDataUrl: string | undefined = undefined;
          const photoFile = zip.file(`photos/${s.id}.jpg`) || zip.file(`photos/${s.id}.png`) || zip.file(`photos/${s.id}.jpeg`);
          if (photoFile) {
            const b64 = await photoFile.async('base64');
            photoDataUrl = `data:image/jpeg;base64,${b64}`;
          }
          importedSaves.push({
            ...s,
            hasPhoto: Boolean(photoDataUrl),
            photo: photoDataUrl
          });
        }
      } else {
        const text = await file.text();
        const parsed = JSON.parse(text);
        importedSaves = parsed.saves || [];
      }

      if (importedSaves.length === 0) {
        alert('No save games found in backup file.');
        return;
      }

      if (confirm(`Import ${importedSaves.length} saves? This will replace your current save points.`)) {
        await db.saves.clear();
        for (const item of importedSaves) {
          await db.saves.put(item);
        }
        showToastMsg(<FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />, `Imported ${importedSaves.length} save(s)!`);
        goToHome();
      }
    } catch {
      alert('Invalid or corrupted backup file.');
    } finally {
      e.target.value = '';
    }
  };

  const filteredSuggestions = useMemo(() => {
    if (!ddOpen || !gameName.trim()) return [];
    const lowerName = gameName.toLowerCase();
    return SUGGESTIONS.filter(item =>
      item.n.toLowerCase().includes(lowerName)
    ).slice(0, 30);
  }, [gameName, ddOpen]);

  const goToHome = () => {
    setSelectedSaveId(null);
    setEditingId(null);
    try { window.history.replaceState({ screen: 'home' }, '', '/'); } catch { /* ignore */ }
    setScreen('home');
  };

  return (
    <div className="phone">

      {/* ══ HOME SCREEN ══ */}
      {screen === 'home' && (
        <div className="screen active">
          <div className="home-header">
            <div className="home-header-row">
              <div className="home-logo">
                <img
                  src="/logo.png"
                  alt="PackAway"
                  className="home-logo-image"
                />

                <div className="logo-text">
                  <span className="logo-app-name">PackAway</span>
                  <p className="home-tagline">Pack it away. Pick it up later.</p>
                </div>
              </div>

              <div className="header-action-buttons">
                <button
                  className="header-icon-button"
                  onClick={() => setDarkMode(!darkMode)}
                  title="Toggle theme"
                  aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                >
                  {darkMode ? (
                    <FontAwesomeIcon icon={faSun} aria-hidden="true" />
                  ) : (
                    <FontAwesomeIcon icon={faMoon} aria-hidden="true" />
                  )}
                </button>

                <button
                  className="header-icon-button"
                  onClick={() => setScreen('about')}
                  title="About"
                  aria-label="About PackAway"
                >
                  <FontAwesomeIcon icon={faLeaf} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <div className="section-header-row">
            <div className="section-label-small" id="saves-list-label">SAVES ({saves.length})</div>
            <div className="sort-toggle-group" role="group" aria-label="Sort saves">
              <button
                className={`sort-button${sortMode === 'date' ? ' on' : ''}`}
                aria-pressed={sortMode === 'date'}
                onClick={() => setSortMode('date')}
              >Recent</button>
              <button
                className={`sort-button${sortMode === 'name' ? ' on' : ''}`}
                aria-pressed={sortMode === 'name'}
                onClick={() => setSortMode('name')}
              >A-Z</button>
            </div>
          </div>

          <div className="game-cards-list" role="list" aria-labelledby="saves-list-label">
            {sortedSaves.map(g => (
              <div key={g.id} className="game-card" role="listitem">
                <div
                  className={`game-card-color-stripe pattern-overlay swatch-pattern-${getPatternIndex(g.color)}`}
                  style={{ background: resolveColor(g.color) }}
                  aria-hidden="true"
                />
                <div
                  className="game-card-body"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${g.name}${g.scenario ? ', ' + g.scenario : ''}`}
                  onClick={() => {
                    setSelectedSaveId(g.id);
                    setShowChecklist(false);
                    try { window.history.replaceState({ screen: 'resume' }, '', `/#/save/${g.id}`); } catch { /* ignore */ }
                    setScreen('resume');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSaveId(g.id);
                      setShowChecklist(false);
                      try { window.history.replaceState({ screen: 'resume' }, '', `/#/save/${g.id}`); } catch { /* ignore */ }
                      setScreen('resume');
                    }
                  }}
                >
                  <div className="game-card-title">{g.name}</div>
                  {g.scenario && <div className="game-card-scenario" style={{ color: resolveColor(g.color) }}>{g.scenario}</div>}
                  <div className="game-card-timestamp">{timeAgo(g.lastModified)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="floating-action-bar-container">
            <button className="btn-primary" onClick={openNewForm}>
              <FontAwesomeIcon icon={faFloppyDisk} aria-hidden="true" /> Save new game
            </button>
          </div>
        </div>
      )}

      {/* ══ RESUME SCREEN ══ */}
      {screen === 'resume' && (
        selectedSave ? (
          <div className="screen active">
            <div className="nav">
              <button className="nav-back" onClick={goToHome}>
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> Back
              </button>
              <div style={{ flex: 1 }} />
              <div className="nav-acts">
                <button className="nav-btn" onClick={() => setDeleteConfirmId(selectedSave.id)} title="Delete" aria-label="Delete this save">
                  <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                </button>
                <button className="nav-btn" onClick={() => openEditForm(selectedSave)} title="Edit" aria-label="Edit this save">
                  <FontAwesomeIcon icon={faEdit} aria-hidden="true" />
                </button>
                <button className="nav-btn" onClick={() => handleShare(selectedSave)} title="Share" aria-label="Share this save">
                  <FontAwesomeIcon icon={faShareNodes} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="save-card">
              {Boolean(selectedSave.photo) && (
                <div
                  className="save-card-photo-container"
                  role="button"
                  tabIndex={0}
                  aria-label="Expand table photo"
                  onClick={() => setFullscreenImage(selectedSave.photo!)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setFullscreenImage(selectedSave.photo!);
                    }
                  }}
                >
                  <img src={selectedSave.photo} alt={`Table setup for ${selectedSave.name}`} className="w-full h-full object-cover" />
                  <div className="save-card-photo-badge">📷 Tap to expand photo</div>
                </div>
              )}

              <div className="save-card-body">
                <div
                  className={`save-card-color-accent pattern-overlay swatch-pattern-${getPatternIndex(selectedSave.color)}`}
                  style={{ background: resolveColor(selectedSave.color) }}
                  aria-hidden="true"
                />

                <div className="save-card-title-block">
                  <h2 className="save-card-title">{selectedSave.name}</h2>
                  {selectedSave.scenario && <p className="save-card-scenario" style={{ color: resolveColor(selectedSave.color) }}>{selectedSave.scenario}</p>}
                  <p className="save-card-date">Saved {timeAgo(selectedSave.lastModified)}</p>
                </div>

                {selectedSave.next && selectedSave.next.trim() && (
                  <div className="save-card-next-intentions-box">
                    <p className="save-card-next-label">WHAT'S NEXT</p>
                    <p className="save-card-next-text-large">{selectedSave.next}</p>
                  </div>
                )}

                {selectedSave.players.length > 0 && (
                  <>
                    <p className="save-card-section-label"><FontAwesomeIcon icon={faUsers} aria-hidden="true" /> PARTY & SCORES</p>
                    {selectedSave.players.map(p => {
                      const isNext = selectedSave.npid != null && p.id === selectedSave.npid;
                      const hpStats = p.stats.filter(s => s.type === 'hp');
                      const numStats = p.stats.filter(s => s.type === 'num');
                      const barColor = resolveColor(selectedSave.color);
                      const patternIdx = getPatternIndex(selectedSave.color);
                      return (
                        <div key={p.id} className="player-recap-block">
                          <div className="player-recap-name">
                            {p.name}
                            {isNext && <span className="player-recap-next-badge">Next</span>}
                          </div>

                          {hpStats.map(hp => (
                            <div key={hp.id} className="player-recap-hp-row">
                              <span className="player-recap-hp-label">{hp.label}</span>
                              <div
                                className="player-recap-bar-track"
                                style={{ borderColor: `${barColor}70` }}
                                role="progressbar"
                                aria-label={`${p.name} ${hp.label}`}
                                aria-valuenow={hp.value}
                                aria-valuemin={0}
                                aria-valuemax={hp.max || 1}
                              >
                                <div
                                  className={`player-recap-bar-fill pattern-overlay swatch-pattern-${patternIdx}`}
                                  style={{ width: `${Math.round(hp.value / (hp.max || 1) * 100)}%`, background: barColor }}
                                />
                              </div>
                              <span className="player-recap-hp-value">{hp.value}/{hp.max}</span>
                            </div>
                          ))}

                          {numStats.map(s => (
                            <div key={s.id} className="player-recap-score-row">
                              <span className="player-recap-score-label">{s.label}</span>
                              <span className="player-recap-score-value">{s.value}</span>
                            </div>
                          ))}
                          <div className="player-recap-note-row">
                            <span className="player-recap-score-label">Note</span>
                            {p.note && <span className="player-recap-note">{' '}{p.note}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

              </div>
            </div>

            {!showChecklist ? (
              <div className="sticky-cta-bar">
                <button className="btn-primary" onClick={() => setShowChecklist(true)}>
                  <FontAwesomeIcon icon={faListCheck} aria-hidden="true" /> Resume
                </button>
              </div>
            ) : (
              <div className="checklist-container" ref={checklistRef}>
                <div className="checklist-header">
                  <span className="save-card-next-label"><FontAwesomeIcon icon={faListCheck} aria-hidden="true" /> Board Setup Checklist</span>
                </div>
                <div className="checklist-items-list" role="group" aria-label="Board setup checklist">
                  {autoChecklist.map((step, idx) => (
                    <div
                      key={idx}
                      className="checklist-item-row"
                      role="checkbox"
                      aria-checked={!!clCompleted[idx]}
                      tabIndex={0}
                      onClick={() => setClCompleted(c => ({ ...c, [idx]: !c[idx] }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setClCompleted(c => ({ ...c, [idx]: !c[idx] }));
                        }
                      }}
                    >
                      <div className={`checklist-checkbox${clCompleted[idx] ? ' done' : ''}`} aria-hidden="true">
                        <span className="checklist-checkmark-tick">✓</span>
                      </div>
                      <span className={`checklist-item-text${clCompleted[idx] ? ' done' : ''}`}>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="sticky-cta-bar">
                  <button className="btn-primary" onClick={goToHome}>
                    <FontAwesomeIcon icon={faDice} aria-hidden="true" /> Back to the table!
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fallback UI if save point doesn't exist on this device */
          <div className="screen active">
            <div className="nav">
              <button className="nav-back" onClick={goToHome}>
                <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> Back
              </button>
            </div>
            <div className="save-card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <h2 className="save-card-title">Save Point Not Found</h2>
              <p style={{ margin: '1rem 0', color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
                This save point doesn't exist on this device or was deleted.
              </p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={goToHome}>
                Go to Home
              </button>
            </div>
          </div>
        )
      )}

      {/* ══ FORM SCREEN ══ */}
      {screen === 'form' && (
        <div className="screen active">
          <div className="nav">
            <button className="nav-back" onClick={goToHome}>
              <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> Back
            </button>
          </div>

          <div className="form-body">
            <input
              type="file" accept="image/*" capture="environment"
              ref={cameraInputRef} onChange={handlePhotoUpload} className="hidden"
            />
            <input
              type="file" accept="image/*"
              ref={galleryInputRef} onChange={handlePhotoUpload} className="hidden"
            />

            <div
              className={`photo-upload-zone${hasPhoto ? ' taken' : ''}`}
              role={!photoData ? 'button' : undefined}
              tabIndex={!photoData ? 0 : undefined}
              aria-label={!photoData ? 'Attach a table photo' : undefined}
              onClick={() => !photoData && setShowPhotoModal(true)}
              onKeyDown={e => {
                if (!photoData && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  setShowPhotoModal(true);
                }
              }}
            >
              {photoData && <img src={photoData} alt="Table setup preview" className="photo-zone-bg-image object-cover w-full h-full" />}
              {photoData ? (
                <div className="photo-zone-overlay">
                  <span>✓ Table photo attached</span>
                  <div className="photo-zone-action-buttons">
                    <button type="button" className="photo-zone-action-btn" onClick={e => { e.stopPropagation(); setShowPhotoModal(true); }}>📷 Change</button>
                    <button type="button" className="photo-zone-action-btn" onClick={e => { e.stopPropagation(); setPhotoData(undefined); setHasPhoto(false); }}>
                      <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCamera} aria-hidden="true" />
                  <div className="photo-zone-main-text">Snap the table</div>
                  <p className="photo-zone-sub-text">Covers board / territory / resources</p>
                </>
              )}
            </div>

            {/* COLOR PICKER */}
            <div className="color-picker-wrap">
              <p className="save-card-section-label" id="color-picker-label"><FontAwesomeIcon icon={faPalette} aria-hidden="true" /> Colour</p>
              <div className="color-picker-row" role="group" aria-labelledby="color-picker-label">
                {PALETTE.map((hex, idx) => (
                  <button
                    key={hex}
                    type="button"
                    className={`color-swatch-touch-wrapper${formColor === hex ? ' sel' : ''}`}
                    onClick={() => setFormColor(hex)}
                    title={`Color ${idx + 1}`}
                    aria-label={`Color option ${idx + 1}`}
                    aria-pressed={formColor === hex}
                  >
                    <div
                      className={`color-swatch-dot pattern-overlay swatch-pattern-${idx + 1}`}
                      style={{ background: hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* GAME NAME */}
            <div className="game-title-input-wrap">
              <div className="md-field">
                <label className="md-label" htmlFor="game-name-input">Game Name</label>
                <input
                  id="game-name-input"
                  ref={gameNameInputRef}
                  className="md-input"
                  value={gameName}
                  role="combobox"
                  aria-expanded={ddOpen && filteredSuggestions.length > 0}
                  aria-controls="game-name-suggestions"
                  autoComplete="off"
                  onFocus={() => {
                    setDdOpen(true);
                    setTimeout(() => {
                      scrollToGameNameInput();
                    }, 100);
                  }}
                  onChange={e => { setGameName(e.target.value); setDdOpen(true); }}
                />
              </div>
              <p className="form-field-hint">Type to search or pick from the list below</p>
            </div>

            {/* SCENARIO */}
            <div className="md-field">
              <label className="md-label" htmlFor="scenario-input">Scenario / Subtitle</label>
              <input
                id="scenario-input"
                className="md-input"
                value={scenario}
                onChange={e => setScenario(e.target.value)}
              />
            </div>
            <p className="form-field-hint">e.g. Round 3, Quest 7 (optional)</p>

            {/* WHAT'S NEXT */}
            <div className="md-field" style={{ marginBottom: '4px' }}>
              <label className="md-label" htmlFor="next-input">What's Next</label>
              <textarea
                id="next-input"
                className="md-textarea"
                rows={3}
                value={nextIntentions}
                onChange={e => setNextIntentions(e.target.value)}
              />
            </div>
            <p className="form-field-hint">What were you about to do? One sentence, written for yourself in three weeks.</p>
            <p className="save-card-section-label" id="players-section-label"><FontAwesomeIcon icon={faUsers} aria-hidden="true" /> PARTY & SCORES</p>
            <div className="form-expandable-section">
              {showPlayersExp && (
                <div className="expandable-section-content open" id="players-section-content">
                  {players.map((p, pIdx) => (
                    <div key={p.id} className="player-editor-card">

                      <div className="player-editor-header">
                        <input
                          className="player-name-input"
                          placeholder="Player name"
                          aria-label="Player name"
                          value={p.name}
                          onChange={e => { const c = [...players]; c[pIdx].name = e.target.value; setPlayers(c); }}
                        />
                        <button className="player-delete-button" aria-label={`Remove ${p.name || 'player'}`} onClick={() => deletePlayer(pIdx)}>
                          <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" />
                        </button>
                      </div>

                      {p.stats.map((s, sIdx) => (
                        <div key={s.id} className="stat-editor-row">
                          <div className={`stat-type-badge ${s.type}`} aria-hidden="true">
                            {s.type === 'hp' ? <FontAwesomeIcon icon={faBarsProgress} aria-hidden="true" /> : <FontAwesomeIcon icon={faHashtag} aria-hidden="true" />}
                          </div>

                          <div className="stat-label-col">
                            <span className="stat-field-prefix" id={`stat-label-prefix-${s.id}`}>Label:</span>
                            <input
                              className="stat-label-input"
                              value={s.label}
                              placeholder={s.type === 'hp' ? 'HP' : 'Score'}
                              aria-labelledby={`stat-label-prefix-${s.id}`}
                              onChange={e => updateStatLabel(pIdx, sIdx, e.target.value)}
                            />
                          </div>

                          <div className="stat-counters-col">
                            {s.type === 'hp' ? (
                              <>
                                <div className="stat-counter-subrow">
                                  <span className="stat-sub-label" id={`stat-now-${s.id}`}>now</span>
                                  <div className="stat-counter-group">
                                    <button type="button" className="stat-counter-btn" aria-label={`Decrease ${s.label || 'HP'} current value`} onClick={() => updateStatValue(pIdx, sIdx, 'value', -1)}>−</button>
                                    <input
                                      type="number"
                                      className="stat-counter-input"
                                      value={s.value}
                                      aria-labelledby={`stat-now-${s.id}`}
                                      onChange={e => setDirectStatValue(pIdx, sIdx, 'value', parseInt(e.target.value) || 0)}
                                    />
                                    <button type="button" className="stat-counter-btn" aria-label={`Increase ${s.label || 'HP'} current value`} onClick={() => updateStatValue(pIdx, sIdx, 'value', 1)}>+</button>
                                  </div>
                                </div>

                                <div className="stat-counter-subrow">
                                  <span className="stat-sub-label" id={`stat-max-${s.id}`}>max</span>
                                  <div className="stat-counter-group">
                                    <button type="button" className="stat-counter-btn" aria-label={`Decrease ${s.label || 'HP'} max value`} onClick={() => updateStatValue(pIdx, sIdx, 'max', -1)}>−</button>
                                    <input
                                      type="number"
                                      className="stat-counter-input"
                                      value={s.max || 1}
                                      aria-labelledby={`stat-max-${s.id}`}
                                      onChange={e => setDirectStatValue(pIdx, sIdx, 'max', parseInt(e.target.value) || 1)}
                                    />
                                    <button type="button" className="stat-counter-btn" aria-label={`Increase ${s.label || 'HP'} max value`} onClick={() => updateStatValue(pIdx, sIdx, 'max', 1)}>+</button>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="stat-counter-subrow">
                                <div className="stat-counter-group">
                                  <button type="button" className="stat-counter-btn" aria-label={`Decrease ${s.label || 'score'}`} onClick={() => updateStatValue(pIdx, sIdx, 'value', -1)}>−</button>
                                  <input
                                    type="number"
                                    className="stat-counter-input"
                                    value={s.value}
                                    aria-label={s.label || 'Score'}
                                    onChange={e => setDirectStatValue(pIdx, sIdx, 'value', parseInt(e.target.value) || 0)}
                                  />
                                  <button type="button" className="stat-counter-btn" aria-label={`Increase ${s.label || 'score'}`} onClick={() => updateStatValue(pIdx, sIdx, 'value', 1)}>+</button>
                                </div>
                              </div>
                            )}
                          </div>

                          <button type="button" className="stat-delete-btn" aria-label={`Remove ${s.label || 'stat'}`} onClick={() => deleteStat(pIdx, sIdx)}>×</button>
                        </div>
                      ))}

                      <div className="add-stat-buttons-row">
                        <button type="button" className="add-hp-stat-btn" onClick={() => {
                          const c = [...players];
                          c[pIdx].stats.push({ id: Date.now(), type: 'hp', label: 'HP', value: 6, max: 8, color: '#F87171' });
                          setPlayers(c);
                        }}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Add Bar</button>
                        <button type="button" className="add-number-stat-btn" onClick={() => {
                          const c = [...players];
                          c[pIdx].stats.push({ id: Date.now(), type: 'num', label: 'Score', value: 0, color: '#6B8EFF' });
                          setPlayers(c);
                        }}><FontAwesomeIcon icon={faPlus} aria-hidden="true" /> Add Number</button>
                      </div>

                      <div className="player-notes-editor-wrap">
                        <label className="player-notes-label" htmlFor={`player-notes-${p.id}`}>PLAYER NOTES</label>
                        <textarea
                          id={`player-notes-${p.id}`}
                          className="player-notes-textarea"
                          rows={2}
                          value={p.note || ''}
                          onChange={e => { const c = [...players]; c[pIdx].note = e.target.value; setPlayers(c); }}
                        />
                        <p className="form-field-hint">Items, conditions, reminders…</p>
                      </div>
                    </div>
                  ))}

                  <button type="button" className="add-player-card-btn"
                    onClick={() => setPlayers([...players, { id: Date.now(), name: `Player ${players.length + 1}`, note: '', stats: [] }])}>
                    + Add player
                  </button>

                  {/* NEXT TURN SELECTOR */}
                  <div className="next-turn-wrap">
                    <p className="save-card-section-label" id="next-turn-label"><FontAwesomeIcon icon={faArrowDownWideShort} aria-hidden="true" />Next turn (optional)</p>
                    {players.length === 0 ? (
                      <p className="next-turn-empty">Add players above to choose who plays next.</p>
                    ) : (
                      <div className="next-turn-chip-row" role="group" aria-labelledby="next-turn-label">
                        {players.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            className={`next-turn-chip${nextPlayerId === p.id ? ' on' : ''}`}
                            aria-pressed={nextPlayerId === p.id}
                            onClick={() => setNextPlayerId(nextPlayerId === p.id ? null : p.id)}
                          >
                            {p.name || 'Unnamed'}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="form-field-hint">Tap a player to mark them next. Tap again to clear.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="sticky-cta-bar">
            <button className="btn-primary" onClick={handleSaveForm} disabled={isSubmitting}>
              <FontAwesomeIcon icon={faFloppyDisk} aria-hidden="true" /> {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ══ GAME NAME DROPDOWN — Fixed to viewport ══ */}
      {screen === 'form' && ddOpen && filteredSuggestions.length > 0 && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setDdOpen(false)} />
          <div className="game-suggestions-dropdown block" id="game-name-suggestions" role="listbox" style={ddStyle}>
            <div className="dropdown-suggestions-list">
              {filteredSuggestions.map(item => (
                <div
                  key={item.n}
                  className="dropdown-suggestion-item"
                  role="option"
                  aria-selected={gameName === item.n}
                  tabIndex={0}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setGameName(item.n); setDdOpen(false); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setGameName(item.n); setDdOpen(false); }
                  }}
                >
                  <span className="dropdown-suggestion-name">{item.n}</span>
                  <span className={`dropdown-suggestion-category ${item.cat.toLowerCase()}`}>{item.cat}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══ ABOUT ══ */}
      {screen === 'about' && (
        <div className="screen active">
          <div className="nav">
            <button className="nav-back" onClick={goToHome}>
              <FontAwesomeIcon icon={faChevronLeft} aria-hidden="true" /> Back
            </button>
          </div>
          <div className="about-hero">
            <img src="/logo-big.png" alt="PackAway Logo" className="about-ico" />
            <h1 className="about-title">PackAway</h1>
            <p className="about-tag">Leave the table. Keep the game.</p>
          </div>
          <div className="about-body">
            <div className="about-card">
              <p className="about-card-ttl">MANIFESTO</p>
              <p>Free. Open source. No account. No ads. No cloud. No tracking.</p>
              <br />
              <p className="mt-2 text-xs">PackAway simply helps you to save and resume your games.</p>
            </div>

            <div className="about-card">
              <p className="about-card-ttl">YOUR DATA</p>
              <div className="data-stat-row">
                <div className="data-stat-block">
                  <span className="data-stat">{saves.length}</span> <span className="data-stat-lbl">Games saved</span>
                </div>
              </div>
              <div className="data-btns">
                <button className="data-btn data-btn-export" onClick={exportBackup}>
                  <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Export ZIP
                </button>
                <label className="data-btn data-btn-import" style={{ cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faUpload} aria-hidden="true" /> Import Backup
                  <input type="file" accept=".zip,.json" onChange={importBackup} className="hidden" />
                </label>
              </div>
            </div>

            <div className="about-card">
              <p className="about-card-ttl">SUPPORT THE PROJECT</p>
              <p>If this saved you, buy me a pot of tea 🍵 🙏🏻</p>
              <div className="donate-row">
                <button className="donate-btn donate-kofi" onClick={() => window.open('https://ko-fi.com/idolofmanyhands', '_blank', 'noopener,noreferrer')}>☕ Ko-fi</button>
                <button className="donate-btn donate-paypal" onClick={() => window.open('https://paypal.me/idolofmanyhands', '_blank', 'noopener,noreferrer')}>♥ PayPal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRMATION MODAL ══ */}
      {deleteConfirmId && (
        <div className="share-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="share-panel" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" onClick={e => e.stopPropagation()}>
            <p className="share-title" id="delete-modal-title" style={{ color: 'var(--color-danger)' }}>Delete Saved Game?</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
              Delete this saved game? This can't be undone.
            </p>
            <div className="share-btns">
              <button
                className="btn-danger"
                onClick={async () => {
                  if (!deleteConfirmId) return;
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  
                  if (selectedSaveId === id) {
                    setSelectedSaveId(null);
                    setScreen('home', false);
                    try { window.history.replaceState({ screen: 'home' }, '', '/'); } catch { /* ignore */ }
                  }
                  
                  await db.saves.delete(id);
                  showToastMsg(<FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />, 'Save point deleted');
                }}
              >
                <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /> Permanently Delete
              </button>
            </div>
            <button className="share-close" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══ PHOTO SOURCE PICKER MODAL ══ */}
      {showPhotoModal && (
        <div className="share-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="share-panel" role="dialog" aria-modal="true" aria-labelledby="photo-modal-title" onClick={e => e.stopPropagation()}>
            <p className="share-title" id="photo-modal-title">Attach Table Photo</p>
            <div className="share-btns">
              <button className="share-btn share-copy" onClick={() => { setShowPhotoModal(false); cameraInputRef.current?.click(); }}>
                <FontAwesomeIcon icon={faCamera} aria-hidden="true" /> Take Photo
              </button>
              <button className="share-btn share-copy" onClick={() => { setShowPhotoModal(false); galleryInputRef.current?.click(); }}>
                <FontAwesomeIcon icon={faImages} aria-hidden="true" /> Choose from Gallery
              </button>
            </div>
            <button className="share-close" onClick={() => setShowPhotoModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══ SHARE MODAL ══ */}
      {shareData && (
        <div className="share-overlay" onClick={() => setShareData(null)}>
          <div className="share-panel" role="dialog" aria-modal="true" aria-labelledby="share-modal-title" onClick={e => e.stopPropagation()}>
            <p className="share-title" id="share-modal-title">Share Save Card</p>

            {/* Table photo preview */}
            {shareData.photo && (
              <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden', maxHeight: '150px' }}>
                <img
                  src={shareData.photo}
                  alt="Table photo preview"
                  style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                />
              </div>
            )}

            <div className="share-btns">
              {/* Share Photo + Text via native OS picker */}
              {shareData.photo && (
                <button
                  className="share-btn share-wa"
                  style={{ fontWeight: 600 }}
                  onClick={async () => {
                    const slug = shareData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                    const file = await dataUrlToFile(shareData.photo!, `${slug}-table.jpg`);
                    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                      try {
                        await navigator.share({
                          files: [file],
                          text: shareData.text
                        });
                        setShareData(null);
                        return;
                      } catch { /* user cancelled */ }
                    }
                    
                    // Fallback for PWAs/devices that do not support files in navigator.share
                    if (navigator.share) {
                      try {
                        await navigator.share({ text: shareData.text });
                        setShareData(null);
                        return;
                      } catch { /* cancelled */ }
                    }

                    showToastMsg(
                      <FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />,
                      'Use WhatsApp or Telegram below to share'
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faCamera} aria-hidden="true" /> Share Photo + Text
                </button>
              )}

              {/* WhatsApp — formatted markdown text using '*' */}
              <a
                className="share-btn share-wa"
                href={`https://wa.me/?text=${encodeURIComponent(shareData.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareData(null)}
              >
                <FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" /> WhatsApp
              </a>

              {/* Telegram — formatted text */}
              <a
                className="share-btn share-tg"
                href={`https://t.me/share/url?text=${encodeURIComponent(shareData.text)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShareData(null)}
              >
                <FontAwesomeIcon icon={faTelegram} aria-hidden="true" /> Telegram
              </a>

              {/* Download photo button if present */}
              {shareData.photo && (
                <button
                  className="share-btn share-copy"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = shareData.photo!;
                    a.download = `${shareData.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-table.jpg`;
                    a.click();
                    showToastMsg(<FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />, 'Table photo downloaded!');
                  }}
                >
                  <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Download Table Photo
                </button>
              )}

              {/* Copy formatted text to clipboard */}
              <button
                className="share-btn share-copy"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareData.text); } catch { /* ignore */ }
                  showToastMsg(<FontAwesomeIcon icon={faCircleCheck} aria-hidden="true" />, 'Copied!');
                  setShareData(null);
                }}
              >
                <FontAwesomeIcon icon={faCopy} aria-hidden="true" /> Copy Text
              </button>
            </div>
            <button className="share-close" onClick={() => setShareData(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══ FULLSCREEN PHOTO MODAL ══ */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Table photo, full screen"
          style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            aria-label="Close photo"
            style={{ position: 'absolute', top: 16, right: 16, width: 48, height: 48, background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: '50%', color: '#fff', fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >×</button>
          <img src={fullscreenImage} alt="Full table" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 12 }} />
        </div>
      )}

      {/* ══ TOAST NOTIFICATION ══ */}
      {toast && (
        <div className="toast show" role="status" aria-live="polite">
          <span aria-hidden="true">{toast.icon}</span>
          <span>{toast.msg}</span>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              marginLeft: 'auto',
              padding: '0 4px',
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}