import { playWave, setWaveVolume } from '#3rdparty/audio.js';
import { stopMidi, setMidiVolume, playMidi } from '#3rdparty/tinymidipcm.js';

import { ClientCode } from '#/client/ClientCode.js';
import GameShell from '#/client/GameShell.js';
import InputTracking from '#/client/InputTracking.js';
import { MenuAction } from '#/client/MenuAction.js';
import MobileKeyboard from '#/client/MobileKeyboard.js';
import MouseTracking from '#/client/MouseTracking.js';

import FloType from '#/config/FloType.js';
import SeqType, { PostanimMove, PreanimMove, RestartMode } from '#/config/SeqType.js';
import LocType from '#/config/LocType.js';
import ObjType from '#/config/ObjType.js';
import NpcType from '#/config/NpcType.js';
import IdkType from '#/config/IdkType.js';
import SpotAnimType from '#/config/SpotAnimType.js';
import VarpType from '#/config/VarpType.js';
import VarBitType from '#/config/VarBitType.js';
import IfType from '#/config/IfType.js';
import { ComponentType, ButtonType } from '#/config/IfType.js';

import ClientBuild from '#/dash3d/ClientBuild.js';
import ClientEntity from '#/dash3d/ClientEntity.js';
import ClientLocAnim from '#/dash3d/ClientLocAnim.js';
import ClientNpc, { NpcUpdate } from '#/dash3d/ClientNpc.js';
import ClientObj from '#/dash3d/ClientObj.js';
import ClientPlayer, { PlayerUpdate } from '#/dash3d/ClientPlayer.js';
import ClientProj from '#/dash3d/ClientProj.js';
import CollisionMap, { CollisionConstants } from '#/dash3d/CollisionMap.js';
import { CollisionFlag } from '#/dash3d/CollisionFlag.js';
import { DirectionFlag } from '#/dash3d/DirectionFlag.js';
import { LocAngle } from '#/dash3d/LocAngle.js';
import LocChange from '#/dash3d/LocChange.js';
import { LocLayer } from '#/dash3d/LocLayer.js';
import LocShape from '#/dash3d/LocShape.js';
import { MapFlag } from '#/dash3d/MapFlag.js';
import MapSpotAnim from '#/dash3d/MapSpotAnim.js';
import World from '#/dash3d/World.js';

import JString from '#/datastruct/JString.js';
import LinkList from '#/datastruct/LinkList.js';

import { Int32Array2d, TypedArray1d, TypedArray3d, Int32Array3d, Uint8Array3d } from '#/util/Arrays.js';
import { downloadUrl, sleep, arraycopy } from '#/util/JsUtil.js';

import AnimFrame from '#/dash3d/AnimFrame.js';
import { canvas2d } from '#/graphics/Canvas.js';
import { Colour } from '#/graphics/Colour.js';
import Pix2D from '#/graphics/Pix2D.js';
import Pix3D from '#/dash3d/Pix3D.js';
import Model from '#/dash3d/Model.js';
import Pix8 from '#/graphics/Pix8.js';
import Pix32 from '#/graphics/Pix32.js';
import PixFont from '#/graphics/PixFont.js';
import PixMap from '#/graphics/PixMap.js';

import ClientStream from '#/io/ClientStream.js';
import { ClientProt } from '#/io/ClientProt.js';
import Database from '#/io/Database.js';
import Isaac from '#/io/Isaac.js';
import Jagfile from '#/io/Jagfile.js';
import Packet from '#/io/Packet.js';
import OnDemand from '#/io/OnDemand.js';
import { ServerProt, ServerProtSizes } from '#/io/ServerProt.js';

import WordFilter from '#/wordenc/WordFilter.js';
import WordPack from '#/wordenc/WordPack.js';

import Wave from '#/sound/Wave.js';

const enum Constants {
    CLIENT_VERSION = 254,
    MAX_CHATS = 50,
    MAX_PLAYER_COUNT = 2048,
    LOCAL_PLAYER_INDEX = 2047
}

// Custom constants
const enum PlayerStat {
    ATTACK,
    DEFENCE,
    STRENGTH,
    HITPOINTS,
    RANGED,
    PRAYER,
    MAGIC,
    COOKING,
    WOODCUTTING,
    FLETCHING,
    FISHING,
    FIREMAKING,
    CRAFTING,
    SMITHING,
    MINING,
    HERBLORE,
    AGILITY,
    THIEVING,
    STAT18,
    STAT19,
    RUNECRAFT
}

export class Client extends GameShell {
    static nodeId: number = 10;
    static membersWorld: boolean = true;
    static lowMem: boolean = false;

    static cyclelogic1: number = 0;
    static cyclelogic2: number = 0;
    static cyclelogic3: number = 0;
    static cyclelogic4: number = 0;
    static cyclelogic5: number = 0;
    static cyclelogic6: number = 0;
    static cyclelogic7: number = 0;
    static cyclelogic8: number = 0;
    static cyclelogic9: number = 0;
    static cyclelogic10: number = 0;

    static oplogic1: number = 0;
    static oplogic2: number = 0;
    static oplogic3: number = 0;
    static oplogic4: number = 0;
    static oplogic5: number = 0;
    static oplogic6: number = 0;
    static oplogic7: number = 0;
    static oplogic8: number = 0;
    static oplogic9: number = 0;
    static oplogic10: number = 0;

    private alreadyStarted: boolean = false;
    private errorStarted: boolean = false;
    private errorLoading: boolean = false;
    private errorHost: boolean = false;
    private errorMessage: string | null = null;

    // important client stuff
    public db: Database | null = null;
    private loopCycle: number = 0;
    private jagChecksum: number[] = [];
    private stream: ClientStream | null = null;
    private in: Packet = Packet.alloc(1);
    private out: Packet = Packet.alloc(1);
    private loginout: Packet = Packet.alloc(1);
    private serverSeed: bigint = 0n;
    private timeoutTimer: number = 0;
    private logoutTimer: number = 0;
    private rebootTimer: number = 0;
    private randomIn: Isaac | null = null;
    private ptype: number = 0;
    private psize: number = 0;
    private ptype0: number = 0;
    private ptype1: number = 0;
    private ptype2: number = 0;

    // archives
    private jagTitle: Jagfile | null = null;

    // login screen properties
    private redrawFrame: boolean = true;
    private imageTitle2: PixMap | null = null;
    private imageTitle3: PixMap | null = null;
    private imageTitle4: PixMap | null = null;
    private imageTitle0: PixMap | null = null;
    private imageTitle1: PixMap | null = null;
    private imageTitle5: PixMap | null = null;
    private imageTitle6: PixMap | null = null;
    private imageTitle7: PixMap | null = null;
    private imageTitle8: PixMap | null = null;
    private imageTitlebox: Pix8 | null = null;
    private imageTitlebutton: Pix8 | null = null;
    private loginscreen: number = 0; // jag::oldscape::TitleScreen::m_loginscreen
    private loginSelect: number = 0; // jag::oldscape::TitleScreen::m_loginSelect
    private loginMes1: string = ''; // jag::oldscape::TitleScreen::m_loginMes1
    private loginMes2: string = ''; // jag::oldscape::TitleScreen::m_loginMes2
    private loginUser: string = 'player'; // jag::oldscape::TitleScreen::m_loginUser
    private loginPass: string = 'player'; // jag::oldscape::TitleScreen::m_loginPass

    // fonts
    private fontPlain11: PixFont | null = null;
    private fontPlain12: PixFont | null = null;
    private fontBold12: PixFont | null = null;
    private fontQuill8: PixFont | null = null;

    // login screen pillar flames properties
    private imageRunes: Pix8[] = [];
    private flameActive: boolean = false;
    private imageFlamesLeft: Pix32 | null = null;
    private imageFlamesRight: Pix32 | null = null;
    private flameBuffer1: Int32Array | null = null;
    private flameBuffer0: Int32Array | null = null;
    private flameBuffer3: Int32Array | null = null;
    private flameBuffer2: Int32Array | null = null;
    private flameGradient: Int32Array | null = null;
    private flameGradient0: Int32Array | null = null;
    private flameGradient1: Int32Array | null = null;
    private flameGradient2: Int32Array | null = null;
    private flameLineOffset: Int32Array = new Int32Array(256);
    private flameCycle0: number = 0;
    private flameGradientCycle0: number = 0;
    private flameGradientCycle1: number = 0;
    private flamesInterval: Timer | null = null;

    // game world properties
    private areaSidebar: PixMap | null = null;
    private areaMapback: PixMap | null = null;
    private areaViewport: PixMap | null = null;
    private areaChatback: PixMap | null = null;
    private areaBackbase1: PixMap | null = null;
    private areaBackbase2: PixMap | null = null;
    private areaBackhmid1: PixMap | null = null;
    private areaBackleft1: PixMap | null = null;
    private areaBackleft2: PixMap | null = null;
    private areaBackright1: PixMap | null = null;
    private areaBackright2: PixMap | null = null;
    private areaBacktop1: PixMap | null = null;
    private areaBackvmid1: PixMap | null = null;
    private areaBackvmid2: PixMap | null = null;
    private areaBackvmid3: PixMap | null = null;
    private areaBackhmid2: PixMap | null = null;
    private chatbackScanline: Int32Array | null = null;
    private sidebarScanline: Int32Array | null = null;
    private viewportScanline: Int32Array | null = null;
    private compassMaskLineOffsets: Int32Array = new Int32Array(33);
    private compassMaskLineLengths: Int32Array = new Int32Array(33);
    private minimapMaskLineOffsets: Int32Array = new Int32Array(151);
    private minimapMaskLineLengths: Int32Array = new Int32Array(151);

    private invback: Pix8 | null = null;
    private chatback: Pix8 | null = null;
    private mapback: Pix8 | null = null;
    private backbase1: Pix8 | null = null;
    private backbase2: Pix8 | null = null;
    private backhmid1: Pix8 | null = null;
    private sideicons: (Pix8 | null)[] = new TypedArray1d(13, null);
    private minimap: Pix32 | null = null;
    private compass: Pix32 | null = null;
    private mapedge: Pix32 | null = null;
    private mapscene: (Pix8 | null)[] = new TypedArray1d(50, null);
    private mapfunction: (Pix32 | null)[] = new TypedArray1d(50, null);
    private hitmarks: (Pix32 | null)[] = new TypedArray1d(20, null);
    private headicons: (Pix32 | null)[] = new TypedArray1d(20, null);
    private mapmarker1: Pix32 | null = null;
    private mapmarker2: Pix32 | null = null;
    private cross: (Pix32 | null)[] = new TypedArray1d(8, null);
    private mapdots1: Pix32 | null = null;
    private mapdots2: Pix32 | null = null;
    private mapdots3: Pix32 | null = null;
    private mapdots4: Pix32 | null = null;
    private scrollbar1: Pix8 | null = null;
    private scrollbar2: Pix8 | null = null;
    private redstone1: Pix8 | null = null;
    private redstone2: Pix8 | null = null;
    private redstone3: Pix8 | null = null;
    private redstone1h: Pix8 | null = null;
    private redstone2h: Pix8 | null = null;
    private redstone1v: Pix8 | null = null;
    private redstone2v: Pix8 | null = null;
    private redstone3v: Pix8 | null = null;
    private redstone1hv: Pix8 | null = null;
    private redstone2hv: Pix8 | null = null;

    private genderButton1: Pix32 | null = null;
    private genderButton2: Pix32 | null = null;

    private activeMapFunctions: (Pix32 | null)[] = new TypedArray1d(1000, null);

    private redrawSidebar: boolean = false;
    private redrawChatback: boolean = false;
    private redrawSideicons: boolean = false;
    private redrawPrivacySettings: boolean = false;
    private mainLayerId: number = -1;
    private dragCycles: number = 0;
    private crossMode: number = 0;
    private crossCycle: number = 0;
    private crossX: number = 0;
    private crossY: number = 0;
    private chatDisabled: number = 0;
    private menuVisible: boolean = false;
    private menuArea: number = 0;
    private menuX: number = 0;
    private menuY: number = 0;
    private menuWidth: number = 0;
    private menuHeight: number = 0;
    private menuSize: number = 0;
    private menuOption: string[] = [];
    private sideLayerId: number = -1;
    private chatLayerId: number = -1;
    private chatInterface: IfType = new IfType();
    private chatScrollHeight: number = 78;
    private chatScrollOffset: number = 0;
    private ignoreCount: number = 0;
    private ignoreName37: bigint[] = [];
    private hintType: number = 0;
    private hintNpc: number = 0;
    private hintOffsetX: number = 0;
    private hintOffsetZ: number = 0;
    private hintPlayer: number = 0;
    private hintTileX: number = 0;
    private hintTileZ: number = 0;
    private hintHeight: number = 0;
    private statXP: number[] = [];
    private statEffectiveLevel: number[] = [];
    private statBaseLevel: number[] = [];
    static levelExperience: number[] = [];
    private modalMessage: string | null = null;
    private flashingTab: number = -1;
    private sideTab: number = 3;
    private sideTabLayerId: number[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    private chatPublicMode: number = 0;
    private chatPrivateMode: number = 0;
    private chatTradeMode: number = 0;
    private scrollGrabbed: boolean = false;
    private scrollInputPadding: number = 0;
    private socialInputOpen: boolean = false;
    private socialMessage: string = '';
    private socialInput: string = '';
    private socialInputType: number = 0;
    private chatbackInput: string = '';
    private dialogInputOpen: boolean = false;
    private tutLayerId: number = -1;
    private messageText: (string | null)[] = new TypedArray1d(100, null);
    private messageSender: (string | null)[] = new TypedArray1d(100, null);
    private messageType: Int32Array = new Int32Array(100);
    private messageTextIds: Int32Array = new Int32Array(100);
    private privateMessageCount: number = 0;
    private splitPrivateChat: number = 0;
    private chatEffects: number = 0;
    private chatTyped: string = '';
    private overMainLayerId: number = 0;
    private overSideLayerId: number = 0;
    private overChatLayerId: number = 0;
    private objDragLayerId: number = 0;
    private objDragSlot: number = 0;
    private objDragArea: number = 0;
    private objGrabX: number = 0;
    private objGrabY: number = 0;
    private objDragCycles: number = 0;
    private objGrabThreshold: boolean = false;
    private objSelected: number = 0;
    private objSelectedSlot: number = 0;
    private objSelectedLayerId: number = 0;
    private objLayerId: number = 0;
    private objSelectedName: string | null = null;
    private selectedArea: number = 0;
    private selectedItem: number = 0;
    private selectedLayerId: number = 0;
    private selectedCycle: number = 0;
    private resumedPauseButton: boolean = false;
    private var: number[] = []; // jag::oldscape::ClientVarCache::m_var
    private varServ: number[] = []; // jag::oldscape::ClientVarCache::m_varServ
    private spellSelected: number = 0;
    private activeSpellId: number = 0;
    private activeSpellFlags: number = 0;
    private spellCaption: string | null = null;
    private oneMouseButton: number = 0;
    private menuAction: Int32Array = new Int32Array(500);
    private menuParamA: Int32Array = new Int32Array(500);
    private menuParamB: Int32Array = new Int32Array(500);
    private menuParamC: Int32Array = new Int32Array(500);
    private hoveredSlotParentId: number = 0;
    private hoveredSlot: number = 0;
    private lastOverLayerId: number = 0;
    private reportAbuseInput: string = '';
    private reportAbuseMuteOption: boolean = false;
    private reportAbuseLayerId: number = -1;
    private lastAddress: number = 0;
    private daysSinceLastLogin: number = 0;
    private daysSinceRecoveriesChanged: number = 0;
    private unreadMessages: number = 0;
    private activeMapFunctionCount: number = 0;
    private activeMapFunctionX: Int32Array = new Int32Array(1000);
    private activeMapFunctionZ: Int32Array = new Int32Array(1000);

    // scene
    private world: World | null = null;
    private sceneState: number = 0;
    private sceneDelta: number = 0;
    private sceneCycle: number = 0;
    private minimapFlagX: number = 0; // jag::oldscape::Client::GetMinimapFlagCoord
    private minimapFlagZ: number = 0;
    private macroCameraCycle: number = 0;
    private macroCameraX: number = 0;
    private macroCameraZ: number = 0;
    private macroCameraAngle: number = 0;
    private macroCameraXModifier: number = 2;
    private macroCameraZModifier: number = 2;
    private macroCameraAngleModifier: number = 1;
    private cameraPitchClamp: number = 0;
    private macroMinimapCycle: number = 0;
    private macroMinimapAngle: number = 0;
    private macroMinimapZoom: number = 0;
    private macroMinimapZoomModifier: number = 1;
    private macroMinimapAngleModifier: number = 2;
    private minimapLevel: number = -1;
    private zoneUpdateX: number = 0;
    private zoneUpdateZ: number = 0;
    private mapBuildCenterZoneX: number = 0;
    private mapBuildCenterZoneZ: number = 0;
    private mapBuildBaseX: number = 0;
    private mapBuildBaseZ: number = 0;
    private mapBuildPrevBaseX: number = 0;
    private mapBuildPrevBaseZ: number = 0;
    private mapBuildGroundData: (Uint8Array | null)[] | null = null; // m_mapBuildGroundData
    private mapBuildGroundFile: number[] = [];
    private mapBuildLocationData: (Uint8Array | null)[] | null = null; // m_mapBuildLocationData
    private mapBuildLocationFile: number[] = [];
    private mapBuildIndex: Int32Array | null = null;
    private withinTutorialIsland: boolean = false;
    private awaitingPlayerInfo: boolean = false;
    private textureBuffer: Int8Array = new Int8Array(16384);
    private levelCollisionMap: (CollisionMap | null)[] = new TypedArray1d(CollisionConstants.LEVELS, null);
    private orbitCameraPitch: number = 128;
    private orbitCameraYaw: number = 0;
    private orbitCameraYawVelocity: number = 0;
    private orbitCameraPitchVelocity: number = 0;
    private orbitCameraX: number = 0;
    private orbitCameraZ: number = 0;
    private minusedlevel: number = 0; // jag::oldscape::ClientBuild::minusedlevel
    private groundh: Int32Array[][] | null = null; // jag::oldscape::ClientBuild::m_groundh
    private mapl: Uint8Array[][] | null = null; // jag::oldscape::ClientBuild::m_mapl
    private tileLastOccupiedCycle: Int32Array[] = new Int32Array2d(CollisionConstants.SIZE, CollisionConstants.SIZE);
    private projectX: number = 0;
    private projectY: number = 0;
    private cinemaCam: boolean = false;
    private camX: number = 0;
    private camY: number = 0;
    private camZ: number = 0;
    private camPitch: number = 0;
    private camYaw: number = 0;
    private camShakeCycle: Int32Array = new Int32Array(5);
    private camShake: boolean[] = new TypedArray1d(5, false);
    private camShakeAxis: Int32Array = new Int32Array(5);
    private camShakeRan: Int32Array = new Int32Array(5);
    private camShakeAmp: Int32Array = new Int32Array(5);
    private camLookAtLx: number = 0;
    private camLookAtLz: number = 0;
    private camLookAtHei: number = 0;
    private camLookAtRate: number = 0;
    private camLookAtRate2: number = 0;
    private camMoveToLx: number = 0;
    private camMoveToLz: number = 0;
    private camMoveToHei: number = 0;
    private camMoveToRate: number = 0;
    private camMoveToRate2: number = 0;

    // entities
    private players: (ClientPlayer | null)[] = new TypedArray1d(Constants.MAX_PLAYER_COUNT, null);
    private playerCount: number = 0;
    private playerIds: Int32Array = new Int32Array(Constants.MAX_PLAYER_COUNT);
    private entityUpdateCount: number = 0;
    private entityRemovalCount: number = 0;
    private entityUpdateIds: Int32Array = new Int32Array(Constants.MAX_PLAYER_COUNT);
    private entityRemovalIds: Int32Array = new Int32Array(1000);
    private playerAppearanceBuffer: (Packet | null)[] = new TypedArray1d(Constants.MAX_PLAYER_COUNT, null);
    private npc: (ClientNpc | null)[] = new TypedArray1d(16384, null);
    private npcCount: number = 0;
    private npcIds: Int32Array = new Int32Array(16384);
    private projectiles: LinkList<ClientProj> = new LinkList();
    private spotanims: LinkList<MapSpotAnim> = new LinkList();
    private objStacks: (LinkList<ClientObj> | null)[][][] = new TypedArray3d(CollisionConstants.LEVELS, CollisionConstants.SIZE, CollisionConstants.SIZE, null);
    private locChanges: LinkList<LocChange> = new LinkList();

    // bfs routefinder
    private routeX: Int32Array = new Int32Array(4000); // jag::oldscape::movement::RouteFinding::m_routeX
    private routeZ: Int32Array = new Int32Array(4000); // jag::oldscape::movement::RouteFinding::m_routeZ
    private dirMap: Int32Array = new Int32Array(CollisionConstants.SIZE * CollisionConstants.SIZE); // jag::oldscape::movement::RouteFinding::m_dirMap
    private distMap: Int32Array = new Int32Array(CollisionConstants.SIZE * CollisionConstants.SIZE); // jag::oldscape::movement::RouteFinding::m_distMap
    private tryMoveNearest: number = 0;

    // player
    private localPlayer: ClientPlayer | null = null;
    private runenergy: number = 0;
    private inMultizone: number = 0;
    private localPid: number = -1;
    private runweight: number = 0;
    private noTimeoutCycle: number = 0;
    private staffmodlevel: number = 0;
    private designGender: boolean = true;
    private updateDesignModel: boolean = false;
    private designKits: Int32Array = new Int32Array(7);
    private designColours: Int32Array = new Int32Array(5);

    // friends/chats
    static readonly CHAT_COLORS = Int32Array.of(Colour.YELLOW, Colour.RED, Colour.GREEN, Colour.CYAN, Colour.MAGENTA, Colour.WHITE);
    private friendCount: number = 0;
    private chatCount: number = 0;
    private chatX: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatY: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatHeight: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatWidth: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatColour: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatEffect: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chatTimer: Int32Array = new Int32Array(Constants.MAX_CHATS);
    private chats: (string | null)[] = new TypedArray1d(Constants.MAX_CHATS, null);
    private friendName: (string | null)[] = new TypedArray1d(200, null);
    private friendName37: BigInt64Array = new BigInt64Array(200);
    private friendWorld: Int32Array = new Int32Array(200);
    private socialName37: bigint | null = null;

    // audio
    private waveCount: number = 0;
    private waveEnabled: boolean = true;
    private waveIds: Int32Array = new Int32Array(50);
    private waveLoops: Int32Array = new Int32Array(50);
    private waveDelay: Int32Array = new Int32Array(50);
    private waveVolume: number = 64;
    private lastWaveId: number = -1;
    private lastWaveLoops: number = -1;
    private lastWaveLength: number = 0;
    private lastWaveStartTime: number = 0;
    private nextMusicDelay: number = 0;
    private midiActive: boolean = true;
    private midiVolume: number = 64;
    private midiSong: number = -1;
    private midiFading: boolean = false;
    private nextMidiSong: number = -1;

    private displayFps: boolean = false;

    private onDemand: OnDemand | null = null;
    ingame: boolean = false;
    modIcons: Pix8[] = [];
    lastProgressPercent: number = 0;
    lastProgressMessage: string = '';
    drawCycle: number = 0;
    sceneLoadStartTime: number = 0;
    mainOverlayLayerId: number = -1;
    bankArrangeMode: number = 0;
    warnMembersInNonMembers: number = 0;
    membersAccount: number = 0;
    flameCycle: number = 0;
    prevMouseClickTime: number = 0;
    sendCameraDelay: number = 0;
    sendCamera: boolean = false;
    focusIn: boolean = false; // jag::oldscape::javapal::GameShell::m_focusIn
    playerOp: (string | null)[] = new TypedArray1d(5, null);
    playerOpPriority: boolean[] = new TypedArray1d(5, false);
    mouseTracking: MouseTracking = new MouseTracking(this);
    mouseTracked: boolean = false;
    mouseTrackedX: number = 0;
    mouseTrackedY: number = 0;
    mouseTrackedDelta: number = 0;
    friendListStatus: number = 0;

    SCROLLBAR_TRACK = 0x23201b;
    SCROLLBAR_GRIP_FOREGROUND = 0x4d4233;
    SCROLLBAR_GRIP_HIGHLIGHT = 0x766654;
    SCROLLBAR_GRIP_LOWLIGHT = 0x332d25;

    static readbit = new Int32Array(32);

    static {
        let n = 2;
        for (let bit = 0; bit < 32; bit++) {
            Client.readbit[bit] = n - 1;
            n += n;
        }
        let acc: number = 0;
        for (let i: number = 0; i < 99; i++) {
            const level: number = i + 1;
            const delta: number = (level + Math.pow(2.0, level / 7.0) * 300.0) | 0;
            acc += delta;
            Client.levelExperience[i] = (acc / 4) | 0;
        }
    }

    // Custom client modifications
    private logUseMenu: boolean = true; // Every time we use a right click menu, log info to console.
    private stopLoop: boolean = false;
    private inventoryComponentId: number = 3214; // \Server\engine\data\symbols\component.sym
    private bankComponentId: number = 5382;
    private lastCheckRunTime: number | null = null;
    private lastLogoutTime: number = performance.now();
    private logArray = [[0, 0]];
    private f1FunctionIndex: number = 0;
    private f1Functions = [
        {
            'description': 'Smith iron knives in Varrock. GET HAMMER.',
            'fn': (obj: Client) => {obj.onF1Pressed_smithIronKnivesVarrock();}
        },
        {
            'description': 'Kill the Lesser demon in the wizard tower. Use mage or ranged.',
            'fn': (obj: Client) => {obj.onF1Pressed_killLesserDemonWizTower();}
        },
        {
            'description': 'Kill chaos druids with ranged. SET RAPID.',
            'fn': (obj: Client) => {obj.onF1Pressed_killChaosDruidsArdyRange();}
        },
        {
            'description': 'Kill moss giants with ranged. SET RAPID.',
            'fn': (obj: Client) => {obj.onF1Pressed_killMossGiantsArdyRange();}
        },
    ];

    private itemIds: { [name: string]: number } = {
        "mcannonremains": 0,
        "mcannontoolkit": 1,
        "mcannonball": 2,
        "nulodions_notes": 3,
        "ammo_mould": 4,
        "mcannonbook": 5,
        "twpart1": 6,
        "cert_twpart1": 7,
        "twpart2": 8,
        "cert_twpart2": 9,
        "twpart3": 10,
        "cert_twpart3": 11,
        "twpart4": 12,
        "cert_twpart4": 13,
        "mcannonrailing1_obj": 14,
        "holy_table_napkin": 15,
        "magic_whistle": 16,
        "grail_bell": 17,
        "magic_golden_feather": 18,
        "holy_grail": 19,
        "whitecog": 20,
        "blackcog": 21,
        "bluecog": 22,
        "redcog": 23,
        "rat_poison": 24,
        "red_vine_worm": 25,
        "hemenster_fishing_trophy": 26,
        "fishing_competition_pass": 27,
        "insect_repellent": 28,
        "cert_insect_repellent": 29,
        "bucket_wax": 30,
        "cert_bucket_wax": 31,
        "lit_black_candle": 32,
        "lit_candle": 33,
        "cert_lit_candle": 34,
        "excalibur": 35,
        "unlit_candle": 36,
        "cert_unlit_candle": 37,
        "unlit_black_candle": 38,
        "bronze_arrowheads": 39,
        "iron_arrowheads": 40,
        "steel_arrowheads": 41,
        "mithril_arrowheads": 42,
        "adamant_arrowheads": 43,
        "rune_arrowheads": 44,
        "opal_bolttips": 45,
        "pearl_bolttips": 46,
        "barbed_bolttips": 47,
        "unstrung_longbow": 48,
        "cert_unstrung_longbow": 49,
        "unstrung_shortbow": 50,
        "cert_unstrung_shortbow": 51,
        "arrow_shaft": 52,
        "headless_arrow": 53,
        "unstrung_oak_shortbow": 54,
        "cert_unstrung_oak_shortbow": 55,
        "unstrung_oak_longbow": 56,
        "cert_unstrung_oak_longbow": 57,
        "unstrung_willow_longbow": 58,
        "cert_unstrung_willow_longbow": 59,
        "unstrung_willow_shortbow": 60,
        "cert_unstrung_willow_shortbow": 61,
        "unstrung_maple_longbow": 62,
        "cert_unstrung_maple_longbow": 63,
        "unstrung_maple_shortbow": 64,
        "cert_unstrung_maple_shortbow": 65,
        "unstrung_yew_longbow": 66,
        "cert_unstrung_yew_longbow": 67,
        "unstrung_yew_shortbow": 68,
        "cert_unstrung_yew_shortbow": 69,
        "unstrung_magic_longbow": 70,
        "cert_unstrung_magic_longbow": 71,
        "unstrung_magic_shortbow": 72,
        "cert_unstrung_magic_shortbow": 73,
        "khazard_helmet": 74,
        "khazard_platemail": 75,
        "khazard_cellkeys": 76,
        "khali_brew": 77,
        "ice_arrow": 78,
        "ice_arrow_4": 79,
        "ice_arrow_3": 80,
        "ice_arrow_2": 81,
        "ice_arrow_5": 82,
        "ikov_lever": 83,
        "ikov_staffofarmardyl": 84,
        "ikov_shinykey": 85,
        "ikov_pendantoflucien": 86,
        "ikov_pendantofarmardyl": 87,
        "ikov_bootsoflightness": 88,
        "ikov_bootsoflightnessworn": 89,
        "childs_blanket": 90,
        "guamvial": 91,
        "cert_guamvial": 92,
        "marrentillvial": 93,
        "cert_marrentillvial": 94,
        "tarrominvial": 95,
        "cert_tarrominvial": 96,
        "harralandervial": 97,
        "cert_harralandervial": 98,
        "ranarrvial": 99,
        "cert_ranarrvial": 100,
        "iritvial": 101,
        "cert_iritvial": 102,
        "avantoevial": 103,
        "cert_avantoevial": 104,
        "kwuarmvial": 105,
        "cert_kwuarmvial": 106,
        "cadantinevial": 107,
        "cert_cadantinevial": 108,
        "dwarfweedvial": 109,
        "cert_dwarfweedvial": 110,
        "torstolvial": 111,
        "cert_torstolvial": 112,
        "strength4": 113,
        "cert_strength4": 114,
        "3dose1strength": 115,
        "cert_3dose1strength": 116,
        "2dose1strength": 117,
        "cert_2dose1strength": 118,
        "1dose1strength": 119,
        "cert_1dose1strength": 120,
        "3dose1attack": 121,
        "cert_3dose1attack": 122,
        "2dose1attack": 123,
        "cert_2dose1attack": 124,
        "1dose1attack": 125,
        "cert_1dose1attack": 126,
        "3dosestatrestore": 127,
        "cert_3dosestatrestore": 128,
        "2dosestatrestore": 129,
        "cert_2dosestatrestore": 130,
        "1dosestatrestore": 131,
        "cert_1dosestatrestore": 132,
        "3dose1defense": 133,
        "cert_3dose1defense": 134,
        "2dose1defense": 135,
        "cert_2dose1defense": 136,
        "1dose1defense": 137,
        "cert_1dose1defense": 138,
        "3doseprayerrestore": 139,
        "cert_3doseprayerrestore": 140,
        "2doseprayerrestore": 141,
        "cert_2doseprayerrestore": 142,
        "1doseprayerrestore": 143,
        "cert_1doseprayerrestore": 144,
        "3dose2attack": 145,
        "cert_3dose2attack": 146,
        "2dose2attack": 147,
        "cert_2dose2attack": 148,
        "1dose2attack": 149,
        "cert_1dose2attack": 150,
        "3dosefisherspotion": 151,
        "cert_3dosefisherspotion": 152,
        "2dosefisherspotion": 153,
        "cert_2dosefisherspotion": 154,
        "1dosefisherspotion": 155,
        "cert_1dosefisherspotion": 156,
        "3dose2strength": 157,
        "cert_3dose2strength": 158,
        "2dose2strength": 159,
        "cert_2dose2strength": 160,
        "1dose2strength": 161,
        "cert_1dose2strength": 162,
        "3dose2defense": 163,
        "cert_3dose2defense": 164,
        "2dose2defense": 165,
        "cert_2dose2defense": 166,
        "1dose2defense": 167,
        "cert_1dose2defense": 168,
        "3doserangerspotion": 169,
        "cert_3doserangerspotion": 170,
        "2doserangerspotion": 171,
        "cert_2doserangerspotion": 172,
        "1doserangerspotion": 173,
        "cert_1doserangerspotion": 174,
        "3doseantipoison": 175,
        "cert_3doseantipoison": 176,
        "2doseantipoison": 177,
        "cert_2doseantipoison": 178,
        "1doseantipoison": 179,
        "cert_1doseantipoison": 180,
        "3dose2antipoison": 181,
        "cert_3dose2antipoison": 182,
        "2dose2antipoison": 183,
        "cert_2dose2antipoison": 184,
        "1dose2antipoison": 185,
        "cert_1dose2antipoison": 186,
        "weapon_poison": 187,
        "cert_weapon_poison": 188,
        "3dosepotionofzamorak": 189,
        "cert_3dosepotionofzamorak": 190,
        "2dosepotionofzamorak": 191,
        "cert_2dosepotionofzamorak": 192,
        "1dosepotionofzamorak": 193,
        "cert_1dosepotionofzamorak": 194,
        "acne_potion": 195,
        "cert_acne_potion": 196,
        "poison_chalice": 197,
        "cert_poison_chalice": 198,
        "unidentified_guam": 199,
        "cert_unidentified_guam": 200,
        "unidentified_marentill": 201,
        "cert_unidentified_marentill": 202,
        "unidentified_tarromin": 203,
        "cert_unidentified_tarromin": 204,
        "unidentified_harralander": 205,
        "cert_unidentified_harralander": 206,
        "unidentified_ranarr": 207,
        "cert_unidentified_ranarr": 208,
        "unidentified_irit": 209,
        "cert_unidentified_irit": 210,
        "unidentified_avantoe": 211,
        "cert_unidentified_avantoe": 212,
        "unidentified_kwuarm": 213,
        "cert_unidentified_kwuarm": 214,
        "unidentified_cadantine": 215,
        "cert_unidentified_cadantine": 216,
        "unidentified_dwarf_weed": 217,
        "cert_unidentified_dwarf_weed": 218,
        "unidentified_torstol": 219,
        "cert_unidentified_torstol": 220,
        "eye_of_newt": 221,
        "cert_eye_of_newt": 222,
        "red_spiders_eggs": 223,
        "cert_red_spiders_eggs": 224,
        "limpwurt_root": 225,
        "cert_limpwurt_root": 226,
        "vial_water": 227,
        "cert_vial_water": 228,
        "vial_empty": 229,
        "cert_vial_empty": 230,
        "snape_grass": 231,
        "cert_snape_grass": 232,
        "pestle_and_mortar": 233,
        "cert_pestle_and_mortar": 234,
        "unicorn_horn_dust": 235,
        "cert_unicorn_horn_dust": 236,
        "unicorn_horn": 237,
        "cert_unicorn_horn": 238,
        "white_berries": 239,
        "cert_white_berries": 240,
        "dragon_scale_dust": 241,
        "cert_dragon_scale_dust": 242,
        "blue_dragon_scale": 243,
        "cert_blue_dragon_scale": 244,
        "wine_of_zamorak": 245,
        "cert_wine_of_zamorak": 246,
        "jangerberries": 247,
        "cert_jangerberries": 248,
        "guam_leaf": 249,
        "cert_guam_leaf": 250,
        "marentill": 251,
        "cert_marentill": 252,
        "tarromin": 253,
        "cert_tarromin": 254,
        "harralander": 255,
        "cert_harralander": 256,
        "ranarr_weed": 257,
        "cert_ranarr_weed": 258,
        "irit_leaf": 259,
        "cert_irit_leaf": 260,
        "avantoe": 261,
        "cert_avantoe": 262,
        "kwuarm": 263,
        "cert_kwuarm": 264,
        "cadantine": 265,
        "cert_cadantine": 266,
        "dwarf_weed": 267,
        "cert_dwarf_weed": 268,
        "torstol": 269,
        "cert_torstol": 270,
        "pressure_gauge": 271,
        "fish_food": 272,
        "poison": 273,
        "poisoned_fish_food": 274,
        "closet_key": 275,
        "rubber_tube": 276,
        "oil_can": 277,
        "cattleprod": 278,
        "poisoned_feed": 279,
        "sheepbonesa": 280,
        "sheepbonesb": 281,
        "sheepbonesc": 282,
        "sheepbonesd": 283,
        "plague_jacket": 284,
        "plague_trousers": 285,
        "goblin_armour_orange": 286,
        "goblin_armour_darkblue": 287,
        "goblin_armour": 288,
        "cert_goblin_armour": 289,
        "research_package": 290,
        "research_notes": 291,
        "baxtorian_book_waterfall_quest": 292,
        "golrie_key_waterfall_quest": 293,
        "glarials_pebble_waterfall_quest": 294,
        "glarials_amulet_waterfall_quest": 295,
        "glarials_urn_full_waterfall_quest": 296,
        "glarials_urn_empty_waterfall_quest": 297,
        "baxtorian_key_waterfall_quest": 298,
        "mithril_seed": 299,
        "rats_tail": 300,
        "lobster_pot": 301,
        "cert_lobster_pot": 302,
        "net": 303,
        "cert_net": 304,
        "big_net": 305,
        "cert_big_net": 306,
        "fishing_rod": 307,
        "cert_fishing_rod": 308,
        "fly_fishing_rod": 309,
        "cert_fly_fishing_rod": 310,
        "harpoon": 311,
        "cert_harpoon": 312,
        "fishing_bait": 313,
        "feather": 314,
        "shrimp": 315,
        "cert_shrimp": 316,
        "raw_shrimp": 317,
        "cert_raw_shrimp": 318,
        "anchovies": 319,
        "cert_anchovies": 320,
        "raw_anchovies": 321,
        "cert_raw_anchovies": 322,
        "burntfish1": 323,
        "cert_burntfish1": 324,
        "sardine": 325,
        "cert_sardine": 326,
        "raw_sardine": 327,
        "cert_raw_sardine": 328,
        "salmon": 329,
        "cert_salmon": 330,
        "raw_salmon": 331,
        "cert_raw_salmon": 332,
        "trout": 333,
        "cert_trout": 334,
        "raw_trout": 335,
        "cert_raw_trout": 336,
        "giant_carp": 337,
        "raw_giant_carp": 338,
        "cod": 339,
        "cert_cod": 340,
        "raw_cod": 341,
        "cert_raw_cod": 342,
        "burntfish2": 343,
        "cert_burntfish2": 344,
        "raw_herring": 345,
        "cert_raw_herring": 346,
        "herring": 347,
        "cert_herring": 348,
        "raw_pike": 349,
        "cert_raw_pike": 350,
        "pike": 351,
        "cert_pike": 352,
        "raw_mackerel": 353,
        "cert_raw_mackerel": 354,
        "mackerel": 355,
        "cert_mackerel": 356,
        "burntfish3": 357,
        "cert_burntfish3": 358,
        "raw_tuna": 359,
        "cert_raw_tuna": 360,
        "tuna": 361,
        "cert_tuna": 362,
        "raw_bass": 363,
        "cert_raw_bass": 364,
        "bass": 365,
        "cert_bass": 366,
        "burntfish4": 367,
        "cert_burntfish4": 368,
        "burntfish5": 369,
        "cert_burntfish5": 370,
        "raw_swordfish": 371,
        "cert_raw_swordfish": 372,
        "swordfish": 373,
        "cert_swordfish": 374,
        "burnt_swordfish": 375,
        "cert_burnt_swordfish": 376,
        "raw_lobster": 377,
        "cert_raw_lobster": 378,
        "lobster": 379,
        "cert_lobster": 380,
        "burnt_lobster": 381,
        "cert_burnt_lobster": 382,
        "raw_shark": 383,
        "cert_raw_shark": 384,
        "shark": 385,
        "cert_shark": 386,
        "burnt_shark": 387,
        "cert_burnt_shark": 388,
        "raw_mantaray": 389,
        "cert_raw_mantaray": 390,
        "mantaray": 391,
        "cert_mantaray": 392,
        "burnt_mantaray": 393,
        "cert_burnt_mantaray": 394,
        "raw_seaturtle": 395,
        "cert_raw_seaturtle": 396,
        "seaturtle": 397,
        "cert_seaturtle": 398,
        "burnt_seaturtle": 399,
        "cert_burnt_seaturtle": 400,
        "seaweed": 401,
        "cert_seaweed": 402,
        "edible_seaweed": 403,
        "cert_edible_seaweed": 404,
        "casket": 405,
        "cert_casket": 406,
        "oystershell": 407,
        "cert_oystershell": 408,
        "oysterempty": 409,
        "cert_oysterempty": 410,
        "smalloysterpearls": 411,
        "cert_smalloysterpearls": 412,
        "bigoysterpearls": 413,
        "cert_bigoysterpearls": 414,
        "ethenea": 415,
        "liquid_honey": 416,
        "sulphuric_broline": 417,
        "plaguesample": 418,
        "touch_paper": 419,
        "distillator": 420,
        "king_lathas_amulet": 421,
        "birdfeed": 422,
        "mournerkeytw": 423,
        "pigeons": 424,
        "pigeoncage": 425,
        "priest_gown": 426,
        "cert_priest_gown": 427,
        "priest_robe": 428,
        "cert_priest_robe": 429,
        "doctor_gown": 430,
        "karamja_rum": 431,
        "chest_key": 432,
        "piratemessage": 433,
        "clay": 434,
        "cert_clay": 435,
        "copper_ore": 436,
        "cert_copper_ore": 437,
        "tin_ore": 438,
        "cert_tin_ore": 439,
        "iron_ore": 440,
        "cert_iron_ore": 441,
        "silver_ore": 442,
        "cert_silver_ore": 443,
        "gold_ore": 444,
        "cert_gold_ore": 445,
        "perfect_gold_ore": 446,
        "mithril_ore": 447,
        "cert_mithril_ore": 448,
        "adamantite_ore": 449,
        "cert_adamantite_ore": 450,
        "runite_ore": 451,
        "cert_runite_ore": 452,
        "coal": 453,
        "cert_coal": 454,
        "barcrawl_card": 455,
        "scorpioncageempty": 456,
        "scorpioncagea": 457,
        "scorpioncageab": 458,
        "scorpioncageac": 459,
        "scorpioncageb": 460,
        "scorpioncagebc": 461,
        "scorpioncagec": 462,
        "scorpioncagefull": 463,
        "macro_triffidfruit": 464,
        "cert_macro_triffidfruit": 465,
        "macro_pickaxehandle": 466,
        "cert_macro_pickaxehandle": 467,
        "macro_broken_bronze_pickaxe": 468,
        "cert_macro_broken_bronze_pickaxe": 469,
        "macro_broken_iron_pickaxe": 470,
        "cert_macro_broken_iron_pickaxe": 471,
        "macro_broken_steel_pickaxe": 472,
        "cert_macro_broken_steel_pickaxe": 473,
        "macro_broken_mithril_pickaxe": 474,
        "cert_macro_broken_mithril_pickaxe": 475,
        "macro_broken_adamant_pickaxe": 476,
        "cert_macro_broken_adamant_pickaxe": 477,
        "macro_broken_rune_pickaxe": 478,
        "cert_macro_broken_rune_pickaxe": 479,
        "macro_bronze_pickaxehead": 480,
        "cert_macro_bronze_pickaxehead": 481,
        "macro_iron_pickaxehead": 482,
        "cert_macro_iron_pickaxehead": 483,
        "macro_steel_pickaxehead": 484,
        "cert_macro_steel_pickaxehead": 485,
        "macro_mithril_pickaxehead": 486,
        "cert_macro_mithril_pickaxehead": 487,
        "macro_adamant_pickaxehead": 488,
        "cert_macro_adamant_pickaxehead": 489,
        "macro_rune_pickaxehead": 490,
        "cert_macro_rune_pickaxehead": 491,
        "macro_hatchethandle": 492,
        "cert_macro_hatchethandle": 493,
        "macro_broken_bronze_hatchet": 494,
        "cert_macro_broken_bronze_hatchet": 495,
        "macro_broken_iron_hatchet": 496,
        "cert_macro_broken_iron_hatchet": 497,
        "macro_broken_steel_hatchet": 498,
        "cert_macro_broken_steel_hatchet": 499,
        "macro_broken_black_hatchet": 500,
        "cert_macro_broken_black_hatchet": 501,
        "macro_broken_mithril_hatchet": 502,
        "cert_macro_broken_mithril_hatchet": 503,
        "macro_broken_adamant_hatchet": 504,
        "cert_macro_broken_adamant_hatchet": 505,
        "macro_broken_rune_hatchet": 506,
        "cert_macro_broken_rune_hatchet": 507,
        "macro_bronze_hatchethead": 508,
        "cert_macro_bronze_hatchethead": 509,
        "macro_iron_hatchethead": 510,
        "cert_macro_iron_hatchethead": 511,
        "macro_steel_hatchethead": 512,
        "cert_macro_steel_hatchethead": 513,
        "macro_black_hatchethead": 514,
        "cert_macro_black_hatchethead": 515,
        "macro_mithril_hatchethead": 516,
        "cert_macro_mithril_hatchethead": 517,
        "macro_adamant_hatchethead": 518,
        "cert_macro_adamant_hatchethead": 519,
        "macro_rune_hatchethead": 520,
        "cert_macro_rune_hatchethead": 521,
        "enchanted_beef": 522,
        "enchanted_rat_meat": 523,
        "enchanted_bear_meat": 524,
        "enchanted_chicken": 525,
        "bones": 526,
        "cert_bones": 527,
        "bones_burnt": 528,
        "cert_bones_burnt": 529,
        "bat_bones": 530,
        "cert_bat_bones": 531,
        "big_bones": 532,
        "cert_big_bones": 533,
        "babydragon_bones": 534,
        "cert_babydragon_bones": 535,
        "dragon_bones": 536,
        "cert_dragon_bones": 537,
        "druidrobebottom": 538,
        "cert_druidrobebottom": 539,
        "druidrobetop": 540,
        "cert_druidrobetop": 541,
        "monkrobebottom": 542,
        "cert_monkrobebottom": 543,
        "monkrobetop": 544,
        "cert_monkrobetop": 545,
        "blackrobetop": 546,
        "cert_blackrobetop": 547,
        "blackrobebottom": 548,
        "cert_blackrobebottom": 549,
        "newcomer_map": 550,
        "cert_newcomer_map": 551,
        "amulet_of_ghostspeak": 552,
        "ghostskull": 553,
        "firerune": 554,
        "waterrune": 555,
        "airrune": 556,
        "earthrune": 557,
        "mindrune": 558,
        "bodyrune": 559,
        "deathrune": 560,
        "naturerune": 561,
        "chaosrune": 562,
        "lawrune": 563,
        "cosmicrune": 564,
        "bloodrune": 565,
        "soulrune": 566,
        "stafforb": 567,
        "cert_stafforb": 568,
        "fire_orb": 569,
        "cert_fire_orb": 570,
        "water_orb": 571,
        "cert_water_orb": 572,
        "air_orb": 573,
        "cert_air_orb": 574,
        "earth_orb": 575,
        "cert_earth_orb": 576,
        "wizards_robe": 577,
        "cert_wizards_robe": 578,
        "bluewizhat": 579,
        "cert_bluewizhat": 580,
        "black_robe": 581,
        "cert_black_robe": 582,
        "bucket_bailing": 583,
        "cert_bucket_bailing": 584,
        "bucket_bailingfull": 585,
        "cert_bucket_bailingfull": 586,
        "orb_of_protection": 587,
        "orbs_of_protection": 588,
        "gnome_amulet": 589,
        "tinderbox": 590,
        "cert_tinderbox": 591,
        "ashes": 592,
        "cert_ashes": 593,
        "torch_lit": 594,
        "cert_torch_lit": 595,
        "torch_unlit": 596,
        "cert_torch_unlit": 597,
        "unlitarrow": 598,
        "obj_599": 599,
        "book_of_astrology": 600,
        "keep_key": 601,
        "lens_mould": 602,
        "lens": 603,
        "zqboneshard": 604,
        "zqbonekey": 605,
        "zqplaque": 606,
        "zqberviriusscroll": 607,
        "zqrashiliyiascroll": 608,
        "zqcorpse": 609,
        "zqzadimusbones": 610,
        "zqcrystal": 611,
        "zqcrystal_blue": 612,
        "zqcrystal_red": 613,
        "zqcrystal_yellow": 614,
        "zqcrystal_white": 615,
        "zqdeadbeads": 616,
        "fake_coins": 617,
        "zqbonebeads": 618,
        "paramayaticket": 619,
        "cert_paramayaticket": 620,
        "shiloshipticket": 621,
        "cert_shiloshipticket": 622,
        "zqbevsword": 623,
        "zqberviriusscroll2": 624,
        "mosol_wampum_belt": 625,
        "gnome_boots_pink": 626,
        "cert_gnome_boots_pink": 627,
        "gnome_boots_green": 628,
        "cert_gnome_boots_green": 629,
        "gnome_boots_blue": 630,
        "cert_gnome_boots_blue": 631,
        "gnome_boots_cream": 632,
        "cert_gnome_boots_cream": 633,
        "gnome_boots_turquoise": 634,
        "cert_gnome_boots_turquoise": 635,
        "gnome_robetop_pink": 636,
        "cert_gnome_robetop_pink": 637,
        "gnome_robetop_green": 638,
        "cert_gnome_robetop_green": 639,
        "gnome_robetop_blue": 640,
        "cert_gnome_robetop_blue": 641,
        "gnome_robetop_cream": 642,
        "cert_gnome_robetop_cream": 643,
        "gnome_robetop_turquoise": 644,
        "cert_gnome_robetop_turquoise": 645,
        "gnome_robebottoms_pink": 646,
        "cert_gnome_robebottoms_pink": 647,
        "gnome_robebottoms_green": 648,
        "cert_gnome_robebottoms_green": 649,
        "gnome_robebottoms_blue": 650,
        "cert_gnome_robebottoms_blue": 651,
        "gnome_robebottoms_cream": 652,
        "cert_gnome_robebottoms_cream": 653,
        "gnome_robebottoms_turquoise": 654,
        "cert_gnome_robebottoms_turquoise": 655,
        "gnome_hat_pink": 656,
        "cert_gnome_hat_pink": 657,
        "gnome_hat_green": 658,
        "cert_gnome_hat_green": 659,
        "gnome_hat_blue": 660,
        "cert_gnome_hat_blue": 661,
        "gnome_hat_cream": 662,
        "cert_gnome_hat_cream": 663,
        "gnome_hat_turquoise": 664,
        "cert_gnome_hat_turquoise": 665,
        "knights_portrait": 666,
        "faladian_sword": 667,
        "blurite_ore": 668,
        "specimen_jar": 669,
        "specimen_brush": 670,
        "rock_sample1": 671,
        "rock_sample2": 672,
        "rock_sample3": 673,
        "cracked_sample": 674,
        "rockpick": 675,
        "trowel": 676,
        "tray_empty": 677,
        "tray_gold": 678,
        "tray_mud": 679,
        "nuggets": 680,
        "digtalisman": 681,
        "digplainletter": 682,
        "recommendedletter": 683,
        "digsitebuckle": 684,
        "old_boot": 685,
        "digsitesword": 686,
        "digsitearrow": 687,
        "digsitebuttons": 688,
        "digsitestaff": 689,
        "digsiteglass": 690,
        "level1certificate": 691,
        "level2certificate": 692,
        "level3certificate": 693,
        "digsitepottery": 694,
        "old_tooth": 695,
        "digexpertscroll": 696,
        "digsitearmour1": 697,
        "digsitearmour2": 698,
        "zarosstonetablet": 699,
        "unidentified_powder": 700,
        "ammonium_nitrate": 701,
        "unidentified_liquid": 702,
        "nitroglycerin": 703,
        "ground_charcoal": 704,
        "precharcoalmixture": 705,
        "postcharcoalmixture": 706,
        "digcompound": 707,
        "arcenia_root": 708,
        "digchestkey": 709,
        "digsitevase": 710,
        "digsitebook": 711,
        "display_tea": 712,
        "obj_713": 713,
        "thkaramjamap": 714,
        "thkaramjamapcomp": 715,
        "bullroarer": 716,
        "scrawled_note1": 717,
        "scrawled_note2": 718,
        "scrawled_note3": 719,
        "goldbowlpic": 720,
        "goldbowl_empty": 721,
        "goldbowlbless_empty": 722,
        "goldbowl_water": 723,
        "goldbowl_pure": 724,
        "goldbowlbless_water": 725,
        "goldbowlbless_pure": 726,
        "reed_hollow": 727,
        "cert_reed_hollow": 728,
        "shamans_tome": 729,
        "book_of_binding": 730,
        "vial_enchanted": 731,
        "holy_water": 732,
        "smashed_glass": 733,
        "cert_smashed_glass": 734,
        "yommiseeds": 735,
        "yommiseeds_germ": 736,
        "snakeweed_sol": 737,
        "ardrigal_sol": 738,
        "bravery_pot": 739,
        "viyeldihat": 740,
        "heartcrystal_sectiona": 741,
        "heartcrystal_sectionb": 742,
        "heartcrystal_sectionc": 743,
        "heartcrystal": 744,
        "heartcrystal_glow": 745,
        "deathdagger": 746,
        "deathdaggerdone": 747,
        "holyforce": 748,
        "thtotempole": 749,
        "thtotempolegift": 750,
        "ball_gnomeball_game": 751,
        "cert_ball_gnomeball_game": 752,
        "cadavaberries": 753,
        "cert_cadavaberries": 754,
        "julietmessage": 755,
        "cadava": 756,
        "the_shield_of_arrav": 757,
        "phoenixkey1": 758,
        "phoenixkey2": 759,
        "cert_phoenixkey2": 760,
        "intelligence_report": 761,
        "cert_intelligence_report": 762,
        "arravshield1": 763,
        "cert_arravshield1": 764,
        "arravshield2": 765,
        "cert_arravshield2": 766,
        "phoenix_crossbow": 767,
        "cert_phoenix_crossbow": 768,
        "arravcertificate": 769,
        "cert_arravcertificate": 770,
        "dramen_branch": 771,
        "dramen_staff": 772,
        "perfect_ruby_ring": 773,
        "perfect_ruby_necklace": 774,
        "gauntlets_of_cooking": 775,
        "gauntlets_of_goldsmithing": 776,
        "gauntlets_of_chaos": 777,
        "steel_gauntlets": 778,
        "avan_crest": 779,
        "caleb_crest": 780,
        "johnathon_crest": 781,
        "family_crest": 782,
        "grandtree_barksample": 783,
        "grandtree_translationbook": 784,
        "grandtree_journal": 785,
        "grandtree_scroll": 786,
        "grandtree_order": 787,
        "grandtree_gloughskey": 788,
        "grandtree_twigt": 789,
        "grandtree_twigu": 790,
        "grandtree_twigz": 791,
        "grandtree_twigo": 792,
        "grandtree_daconiarock": 793,
        "grandtree_invasionplans": 794,
        "grandtree_warship": 795,
        "explodingvial": 796,
        "herbbowl": 797,
        "grinder": 798,
        "template_for_cert": 799,
        "bronze_thrownaxe": 800,
        "iron_thrownaxe": 801,
        "steel_thrownaxe": 802,
        "mithril_thrownaxe": 803,
        "adamnt_thrownaxe": 804,
        "rune_thrownaxe": 805,
        "bronze_dart": 806,
        "iron_dart": 807,
        "steel_dart": 808,
        "mithril_dart": 809,
        "adamant_dart": 810,
        "rune_dart": 811,
        "bronze_dart_p": 812,
        "iron_dart_p": 813,
        "steel_dart_p": 814,
        "mithril_dart_p": 815,
        "adamant_dart_p": 816,
        "rune_dart_p": 817,
        "dart_poisoned_p": 818,
        "bronze_dart_tip": 819,
        "iron_dart_tip": 820,
        "steel_dart_tip": 821,
        "mithril_dart_tip": 822,
        "adamant_dart_tip": 823,
        "rune_dart_tip": 824,
        "bronze_javelin": 825,
        "iron_javelin": 826,
        "steel_javelin": 827,
        "mithril_javelin": 828,
        "adamant_javelin": 829,
        "rune_javelin": 830,
        "bronze_javelin_p": 831,
        "iron_javelin_p": 832,
        "steel_javelin_p": 833,
        "mithril_javelin_p": 834,
        "adamant_javelin_p": 835,
        "rune_javelin_p": 836,
        "crossbow": 837,
        "cert_crossbow": 838,
        "longbow": 839,
        "cert_longbow": 840,
        "shortbow": 841,
        "cert_shortbow": 842,
        "oak_shortbow": 843,
        "cert_oak_shortbow": 844,
        "oak_longbow": 845,
        "cert_oak_longbow": 846,
        "willow_longbow": 847,
        "cert_willow_longbow": 848,
        "willow_shortbow": 849,
        "cert_willow_shortbow": 850,
        "maple_longbow": 851,
        "cert_maple_longbow": 852,
        "maple_shortbow": 853,
        "cert_maple_shortbow": 854,
        "yew_longbow": 855,
        "cert_yew_longbow": 856,
        "yew_shortbow": 857,
        "cert_yew_shortbow": 858,
        "magic_longbow": 859,
        "cert_magic_longbow": 860,
        "magic_shortbow": 861,
        "cert_magic_shortbow": 862,
        "iron_knife": 863,
        "bronze_knife": 864,
        "steel_knife": 865,
        "mithril_knife": 866,
        "adamant_knife": 867,
        "rune_knife": 868,
        "black_knife": 869,
        "bronze_knife_p": 870,
        "iron_knife_p": 871,
        "steel_knife_p": 872,
        "mithril_knife_p": 873,
        "black_knife_p": 874,
        "adamant_knife_p": 875,
        "rune_knife_p": 876,
        "bolt": 877,
        "poison_bolt": 878,
        "opal_bolt": 879,
        "pearl_bolt": 880,
        "barbed_bolt": 881,
        "bronze_arrow": 882,
        "bronze_arrow_p": 883,
        "iron_arrow": 884,
        "iron_arrow_p": 885,
        "steel_arrow": 886,
        "steel_arrow_p": 887,
        "mithril_arrow": 888,
        "mithril_arrow_p": 889,
        "adamant_arrow": 890,
        "adamant_arrow_p": 891,
        "rune_arrow": 892,
        "rune_arrow_p": 893,
        "bronze_arrow_4": 894,
        "bronze_arrow_3": 895,
        "bronze_arrow_2": 896,
        "bronze_arrow_5": 897,
        "bronze_arrow_p_4": 898,
        "bronze_arrow_p_3": 899,
        "bronze_arrow_p_2": 900,
        "bronze_arrow_p_5": 901,
        "iron_arrow_4": 902,
        "iron_arrow_3": 903,
        "iron_arrow_2": 904,
        "iron_arrow_5": 905,
        "iron_arrow_p_4": 906,
        "iron_arrow_p_3": 907,
        "iron_arrow_p_2": 908,
        "iron_arrow_p_5": 909,
        "steel_arrow_4": 910,
        "steel_arrow_3": 911,
        "steel_arrow_2": 912,
        "steel_arrow_5": 913,
        "steel_arrow_p_4": 914,
        "steel_arrow_p_3": 915,
        "steel_arrow_p_2": 916,
        "steel_arrow_p_5": 917,
        "mithril_arrow_4": 918,
        "mithril_arrow_3": 919,
        "mithril_arrow_2": 920,
        "mithril_arrow_5": 921,
        "mithril_arrow_p_4": 922,
        "mithril_arrow_p_3": 923,
        "mithril_arrow_p_2": 924,
        "mithril_arrow_p_5": 925,
        "adamant_arrow_4": 926,
        "adamant_arrow_3": 927,
        "adamant_arrow_2": 928,
        "adamant_arrow_5": 929,
        "adamant_arrow_p_4": 930,
        "adamant_arrow_p_3": 931,
        "adamant_arrow_p_2": 932,
        "adamant_arrow_p_5": 933,
        "rune_arrow_4": 934,
        "rune_arrow_3": 935,
        "rune_arrow_2": 936,
        "rune_arrow_5": 937,
        "rune_arrow_p_4": 938,
        "rune_arrow_p_3": 939,
        "rune_arrow_p_2": 940,
        "rune_arrow_p_5": 941,
        "litarrow": 942,
        "worm": 943,
        "cert_worm": 944,
        "throwingrope": 945,
        "knife": 946,
        "cert_knife": 947,
        "fur": 948,
        "cert_fur": 949,
        "silk": 950,
        "cert_silk": 951,
        "spade": 952,
        "cert_spade": 953,
        "rope": 954,
        "cert_rope": 955,
        "flier": 956,
        "cert_flier": 957,
        "grey_wolf_fur": 958,
        "cert_grey_wolf_fur": 959,
        "woodplank": 960,
        "cert_woodplank": 961,
        "christmas_cracker": 962,
        "cert_christmas_cracker": 963,
        "skull": 964,
        "cert_skull": 965,
        "rooftile": 966,
        "cert_rooftile": 967,
        "rock": 968,
        "cert_rock": 969,
        "papyrus": 970,
        "cert_papyrus": 971,
        "papyrus_used": 972,
        "charcoal": 973,
        "cert_charcoal": 974,
        "machette": 975,
        "cert_machette": 976,
        "cooking_pot": 977,
        "cert_cooking_pot": 978,
        "highwayman_mask": 979,
        "cert_highwayman_mask": 980,
        "discofreturning": 981,
        "cert_discofreturning": 982,
        "edgevilledungeonkey": 983,
        "cert_edgevilledungeonkey": 984,
        "keyhalf1": 985,
        "cert_keyhalf1": 986,
        "keyhalf2": 987,
        "cert_keyhalf2": 988,
        "crystal_key": 989,
        "cert_crystal_key": 990,
        "muddy_key": 991,
        "cert_muddy_key": 992,
        "sinister_key": 993,
        "cert_sinister_key": 994,
        "coins": 995,
        "coins_2": 996,
        "coins_3": 997,
        "coins_4": 998,
        "coins_5": 999,
        "coins_25": 1000,
        "coins_100": 1001,
        "coins_250": 1002,
        "coins_1000": 1003,
        "coins_10000": 1004,
        "white_apron": 1005,
        "cert_white_apron": 1006,
        "red_cape": 1007,
        "cert_red_cape": 1008,
        "brass_necklace": 1009,
        "cert_brass_necklace": 1010,
        "blue_skirt": 1011,
        "cert_blue_skirt": 1012,
        "pink_skirt": 1013,
        "cert_pink_skirt": 1014,
        "black_skirt": 1015,
        "cert_black_skirt": 1016,
        "blackwizhat": 1017,
        "cert_blackwizhat": 1018,
        "black_cape": 1019,
        "cert_black_cape": 1020,
        "blue_cape": 1021,
        "cert_blue_cape": 1022,
        "yellow_cape": 1023,
        "cert_yellow_cape": 1024,
        "eye_patch": 1025,
        "cert_eye_patch": 1026,
        "green_cape": 1027,
        "cert_green_cape": 1028,
        "purple_cape": 1029,
        "cert_purple_cape": 1030,
        "orange_cape": 1031,
        "cert_orange_cape": 1032,
        "zamrobebottom": 1033,
        "cert_zamrobebottom": 1034,
        "zamrobetop": 1035,
        "cert_zamrobetop": 1036,
        "bunnyears": 1037,
        "red_partyhat": 1038,
        "cert_red_partyhat": 1039,
        "yellow_partyhat": 1040,
        "cert_yellow_partyhat": 1041,
        "blue_partyhat": 1042,
        "cert_blue_partyhat": 1043,
        "green_partyhat": 1044,
        "cert_green_partyhat": 1045,
        "purple_partyhat": 1046,
        "cert_purple_partyhat": 1047,
        "white_partyhat": 1048,
        "cert_white_partyhat": 1049,
        "santa_hat": 1050,
        "cert_santa_hat": 1051,
        "cape_of_legends": 1052,
        "halloweenmask_green": 1053,
        "cert_halloweenmask_green": 1054,
        "halloweenmask_blue": 1055,
        "cert_halloweenmask_blue": 1056,
        "halloweenmask_red": 1057,
        "cert_halloweenmask_red": 1058,
        "leather_gloves": 1059,
        "cert_leather_gloves": 1060,
        "leather_boots": 1061,
        "cert_leather_boots": 1062,
        "leather_vambraces": 1063,
        "cert_leather_vambraces": 1064,
        "dragon_vambraces": 1065,
        "cert_dragon_vambraces": 1066,
        "iron_platelegs": 1067,
        "cert_iron_platelegs": 1068,
        "steel_platelegs": 1069,
        "cert_steel_platelegs": 1070,
        "mithril_platelegs": 1071,
        "cert_mithril_platelegs": 1072,
        "adamant_platelegs": 1073,
        "cert_adamant_platelegs": 1074,
        "bronze_platelegs": 1075,
        "cert_bronze_platelegs": 1076,
        "black_platelegs": 1077,
        "cert_black_platelegs": 1078,
        "rune_platelegs": 1079,
        "cert_rune_platelegs": 1080,
        "iron_plateskirt": 1081,
        "cert_iron_plateskirt": 1082,
        "steel_plateskirt": 1083,
        "cert_steel_plateskirt": 1084,
        "mithril_plateskirt": 1085,
        "cert_mithril_plateskirt": 1086,
        "bronze_plateskirt": 1087,
        "cert_bronze_plateskirt": 1088,
        "black_plateskirt": 1089,
        "cert_black_plateskirt": 1090,
        "adamant_plateskirt": 1091,
        "cert_adamant_plateskirt": 1092,
        "rune_plateskirt": 1093,
        "cert_rune_plateskirt": 1094,
        "leather_chaps": 1095,
        "cert_leather_chaps": 1096,
        "studded_chaps": 1097,
        "cert_studded_chaps": 1098,
        "dragonhide_chaps": 1099,
        "cert_dragonhide_chaps": 1100,
        "iron_chainbody": 1101,
        "cert_iron_chainbody": 1102,
        "bronze_chainbody": 1103,
        "cert_bronze_chainbody": 1104,
        "steel_chainbody": 1105,
        "cert_steel_chainbody": 1106,
        "black_chainbody": 1107,
        "cert_black_chainbody": 1108,
        "mithril_chainbody": 1109,
        "cert_mithril_chainbody": 1110,
        "adamant_chainbody": 1111,
        "cert_adamant_chainbody": 1112,
        "rune_chainbody": 1113,
        "cert_rune_chainbody": 1114,
        "iron_platebody": 1115,
        "cert_iron_platebody": 1116,
        "bronze_platebody": 1117,
        "cert_bronze_platebody": 1118,
        "steel_platebody": 1119,
        "cert_steel_platebody": 1120,
        "mithril_platebody": 1121,
        "cert_mithril_platebody": 1122,
        "adamant_platebody": 1123,
        "cert_adamant_platebody": 1124,
        "black_platebody": 1125,
        "cert_black_platebody": 1126,
        "rune_platebody": 1127,
        "cert_rune_platebody": 1128,
        "leather_armour": 1129,
        "cert_leather_armour": 1130,
        "hardleather_body": 1131,
        "cert_hardleather_body": 1132,
        "studded_body": 1133,
        "cert_studded_body": 1134,
        "dragonhide_body": 1135,
        "cert_dragonhide_body": 1136,
        "iron_med_helm": 1137,
        "cert_iron_med_helm": 1138,
        "bronze_med_helm": 1139,
        "cert_bronze_med_helm": 1140,
        "steel_med_helm": 1141,
        "cert_steel_med_helm": 1142,
        "mithril_med_helm": 1143,
        "cert_mithril_med_helm": 1144,
        "adamant_med_helm": 1145,
        "cert_adamant_med_helm": 1146,
        "rune_med_helm": 1147,
        "cert_rune_med_helm": 1148,
        "dragon_med_helm": 1149,
        "cert_dragon_med_helm": 1150,
        "black_med_helm": 1151,
        "cert_black_med_helm": 1152,
        "iron_full_helm": 1153,
        "cert_iron_full_helm": 1154,
        "bronze_full_helm": 1155,
        "cert_bronze_full_helm": 1156,
        "steel_full_helm": 1157,
        "cert_steel_full_helm": 1158,
        "mithril_full_helm": 1159,
        "cert_mithril_full_helm": 1160,
        "adamant_full_helm": 1161,
        "cert_adamant_full_helm": 1162,
        "rune_full_helm": 1163,
        "cert_rune_full_helm": 1164,
        "black_full_helm": 1165,
        "cert_black_full_helm": 1166,
        "leather_cowl": 1167,
        "cert_leather_cowl": 1168,
        "coif": 1169,
        "cert_coif": 1170,
        "wooden_shield": 1171,
        "cert_wooden_shield": 1172,
        "bronze_sq_shield": 1173,
        "cert_bronze_sq_shield": 1174,
        "iron_sq_shield": 1175,
        "cert_iron_sq_shield": 1176,
        "steel_sq_shield": 1177,
        "cert_steel_sq_shield": 1178,
        "black_sq_shield": 1179,
        "cert_black_sq_shield": 1180,
        "mithril_sq_shield": 1181,
        "cert_mithril_sq_shield": 1182,
        "adamant_sq_shield": 1183,
        "cert_adamant_sq_shield": 1184,
        "rune_sq_shield": 1185,
        "cert_rune_sq_shield": 1186,
        "dragon_sq_shield": 1187,
        "cert_dragon_sq_shield": 1188,
        "bronze_kiteshield": 1189,
        "cert_bronze_kiteshield": 1190,
        "iron_kiteshield": 1191,
        "cert_iron_kiteshield": 1192,
        "steel_kiteshield": 1193,
        "cert_steel_kiteshield": 1194,
        "black_kiteshield": 1195,
        "cert_black_kiteshield": 1196,
        "mithril_kiteshield": 1197,
        "cert_mithril_kiteshield": 1198,
        "adamant_kiteshield": 1199,
        "cert_adamant_kiteshield": 1200,
        "rune_kiteshield": 1201,
        "cert_rune_kiteshield": 1202,
        "iron_dagger": 1203,
        "cert_iron_dagger": 1204,
        "bronze_dagger": 1205,
        "cert_bronze_dagger": 1206,
        "steel_dagger": 1207,
        "cert_steel_dagger": 1208,
        "mithril_dagger": 1209,
        "cert_mithril_dagger": 1210,
        "adamant_dagger": 1211,
        "cert_adamant_dagger": 1212,
        "rune_dagger": 1213,
        "cert_rune_dagger": 1214,
        "dragon_dagger": 1215,
        "cert_dragon_dagger": 1216,
        "black_dagger": 1217,
        "cert_black_dagger": 1218,
        "iron_dagger_p": 1219,
        "cert_iron_dagger_p": 1220,
        "bronze_dagger_p": 1221,
        "cert_bronze_dagger_p": 1222,
        "steel_dagger_p": 1223,
        "cert_steel_dagger_p": 1224,
        "mithril_dagger_p": 1225,
        "cert_mithril_dagger_p": 1226,
        "adamant_dagger_p": 1227,
        "cert_adamant_dagger_p": 1228,
        "rune_dagger_p": 1229,
        "cert_rune_dagger_p": 1230,
        "dragon_dagger_p": 1231,
        "cert_dragon_dagger_p": 1232,
        "black_dagger_p": 1233,
        "cert_black_dagger_p": 1234,
        "poisoned_dagger_p": 1235,
        "cert_poisoned_dagger_p": 1236,
        "bronze_spear": 1237,
        "cert_bronze_spear": 1238,
        "iron_spear": 1239,
        "cert_iron_spear": 1240,
        "steel_spear": 1241,
        "cert_steel_spear": 1242,
        "mithril_spear": 1243,
        "cert_mithril_spear": 1244,
        "adamant_spear": 1245,
        "cert_adamant_spear": 1246,
        "rune_spear": 1247,
        "cert_rune_spear": 1248,
        "dragon_spear": 1249,
        "cert_dragon_spear": 1250,
        "bronze_spear_p": 1251,
        "cert_bronze_spear_p": 1252,
        "iron_spear_p": 1253,
        "cert_iron_spear_p": 1254,
        "steel_spear_p": 1255,
        "cert_steel_spear_p": 1256,
        "mithril_spear_p": 1257,
        "cert_mithril_spear_p": 1258,
        "adamant_spear_p": 1259,
        "cert_adamant_spear_p": 1260,
        "rune_spear_p": 1261,
        "cert_rune_spear_p": 1262,
        "dragon_spear_p": 1263,
        "cert_dragon_spear_p": 1264,
        "bronze_pickaxe": 1265,
        "cert_bronze_pickaxe": 1266,
        "iron_pickaxe": 1267,
        "cert_iron_pickaxe": 1268,
        "steel_pickaxe": 1269,
        "cert_steel_pickaxe": 1270,
        "adamant_pickaxe": 1271,
        "cert_adamant_pickaxe": 1272,
        "mithril_pickaxe": 1273,
        "cert_mithril_pickaxe": 1274,
        "rune_pickaxe": 1275,
        "cert_rune_pickaxe": 1276,
        "bronze_sword": 1277,
        "cert_bronze_sword": 1278,
        "iron_sword": 1279,
        "cert_iron_sword": 1280,
        "steel_sword": 1281,
        "cert_steel_sword": 1282,
        "black_sword": 1283,
        "cert_black_sword": 1284,
        "mithril_sword": 1285,
        "cert_mithril_sword": 1286,
        "adamant_sword": 1287,
        "cert_adamant_sword": 1288,
        "rune_sword": 1289,
        "cert_rune_sword": 1290,
        "bronze_longsword": 1291,
        "cert_bronze_longsword": 1292,
        "iron_longsword": 1293,
        "cert_iron_longsword": 1294,
        "steel_longsword": 1295,
        "cert_steel_longsword": 1296,
        "black_longsword": 1297,
        "cert_black_longsword": 1298,
        "mithril_longsword": 1299,
        "cert_mithril_longsword": 1300,
        "adamant_longsword": 1301,
        "cert_adamant_longsword": 1302,
        "rune_longsword": 1303,
        "cert_rune_longsword": 1304,
        "dragon_longsword": 1305,
        "cert_dragon_longsword": 1306,
        "bronze_2h_sword": 1307,
        "cert_bronze_2h_sword": 1308,
        "iron_2h_sword": 1309,
        "cert_iron_2h_sword": 1310,
        "steel_2h_sword": 1311,
        "cert_steel_2h_sword": 1312,
        "black_2h_sword": 1313,
        "cert_black_2h_sword": 1314,
        "mithril_2h_sword": 1315,
        "cert_mithril_2h_sword": 1316,
        "adamant_2h_sword": 1317,
        "cert_adamant_2h_sword": 1318,
        "rune_2h_sword": 1319,
        "cert_rune_2h_sword": 1320,
        "bronze_scimitar": 1321,
        "cert_bronze_scimitar": 1322,
        "iron_scimitar": 1323,
        "cert_iron_scimitar": 1324,
        "steel_scimitar": 1325,
        "cert_steel_scimitar": 1326,
        "black_scimitar": 1327,
        "cert_black_scimitar": 1328,
        "mithril_scimitar": 1329,
        "cert_mithril_scimitar": 1330,
        "adamant_scimitar": 1331,
        "cert_adamant_scimitar": 1332,
        "rune_scimitar": 1333,
        "cert_rune_scimitar": 1334,
        "iron_warhammer": 1335,
        "cert_iron_warhammer": 1336,
        "bronze_warhammer": 1337,
        "cert_bronze_warhammer": 1338,
        "steel_warhammer": 1339,
        "cert_steel_warhammer": 1340,
        "black_warhammer": 1341,
        "cert_black_warhammer": 1342,
        "mithril_warhammer": 1343,
        "cert_mithril_warhammer": 1344,
        "adamnt_warhammer": 1345,
        "cert_adamnt_warhammer": 1346,
        "rune_warhammer": 1347,
        "cert_rune_warhammer": 1348,
        "iron_axe": 1349,
        "cert_iron_axe": 1350,
        "bronze_axe": 1351,
        "cert_bronze_axe": 1352,
        "steel_axe": 1353,
        "cert_steel_axe": 1354,
        "mithril_axe": 1355,
        "cert_mithril_axe": 1356,
        "adamant_axe": 1357,
        "cert_adamant_axe": 1358,
        "rune_axe": 1359,
        "cert_rune_axe": 1360,
        "black_axe": 1361,
        "cert_black_axe": 1362,
        "iron_battleaxe": 1363,
        "cert_iron_battleaxe": 1364,
        "steel_battleaxe": 1365,
        "cert_steel_battleaxe": 1366,
        "black_battleaxe": 1367,
        "cert_black_battleaxe": 1368,
        "mithril_battleaxe": 1369,
        "cert_mithril_battleaxe": 1370,
        "adamant_battleaxe": 1371,
        "cert_adamant_battleaxe": 1372,
        "rune_battleaxe": 1373,
        "cert_rune_battleaxe": 1374,
        "bronze_battleaxe": 1375,
        "cert_bronze_battleaxe": 1376,
        "dragon_battleaxe": 1377,
        "cert_dragon_battleaxe": 1378,
        "plainstaff": 1379,
        "cert_plainstaff": 1380,
        "staff_of_air": 1381,
        "cert_staff_of_air": 1382,
        "staff_of_water": 1383,
        "cert_staff_of_water": 1384,
        "staff_of_earth": 1385,
        "cert_staff_of_earth": 1386,
        "staff_of_fire": 1387,
        "cert_staff_of_fire": 1388,
        "magic_staff": 1389,
        "cert_magic_staff": 1390,
        "battlestaff": 1391,
        "cert_battlestaff": 1392,
        "fire_battlestaff": 1393,
        "cert_fire_battlestaff": 1394,
        "water_battlestaff": 1395,
        "cert_water_battlestaff": 1396,
        "air_battlestaff": 1397,
        "cert_air_battlestaff": 1398,
        "earth_battlestaff": 1399,
        "cert_earth_battlestaff": 1400,
        "mystic_fire_staff": 1401,
        "cert_mystic_fire_staff": 1402,
        "mystic_water_staff": 1403,
        "cert_mystic_water_staff": 1404,
        "mystic_air_staff": 1405,
        "cert_mystic_air_staff": 1406,
        "mystic_earth_staff": 1407,
        "cert_mystic_earth_staff": 1408,
        "ibanstaff": 1409,
        "brokenibanstaff": 1410,
        "farmers_fork": 1411,
        "cert_farmers_fork": 1412,
        "halberd": 1413,
        "cert_halberd": 1414,
        "warhammer": 1415,
        "cert_warhammer": 1416,
        "javelin": 1417,
        "cert_javelin": 1418,
        "scythe": 1419,
        "iron_mace": 1420,
        "cert_iron_mace": 1421,
        "bronze_mace": 1422,
        "cert_bronze_mace": 1423,
        "steel_mace": 1424,
        "cert_steel_mace": 1425,
        "black_mace": 1426,
        "cert_black_mace": 1427,
        "mithril_mace": 1428,
        "cert_mithril_mace": 1429,
        "adamant_mace": 1430,
        "cert_adamant_mace": 1431,
        "rune_mace": 1432,
        "cert_rune_mace": 1433,
        "dragon_mace": 1434,
        "cert_dragon_mace": 1435,
        "blankrune": 1436,
        "cert_blankrune": 1437,
        "air_talisman": 1438,
        "cert_air_talisman": 1439,
        "earth_talisman": 1440,
        "cert_earth_talisman": 1441,
        "fire_talisman": 1442,
        "cert_fire_talisman": 1443,
        "water_talisman": 1444,
        "cert_water_talisman": 1445,
        "body_talisman": 1446,
        "cert_body_talisman": 1447,
        "mind_talisman": 1448,
        "cert_mind_talisman": 1449,
        "blood_talisman": 1450,
        "cert_blood_talisman": 1451,
        "chaos_talisman": 1452,
        "cert_chaos_talisman": 1453,
        "cosmic_talisman": 1454,
        "cert_cosmic_talisman": 1455,
        "death_talisman": 1456,
        "cert_death_talisman": 1457,
        "law_talisman": 1458,
        "obj_1459": 1459,
        "soul_talisman": 1460,
        "cert_soul_talisman": 1461,
        "nature_talisman": 1462,
        "cert_nature_talisman": 1463,
        "archery_ticket": 1464,
        "display_weapon_poison": 1465,
        "seasluginv": 1466,
        "damp_sticks": 1467,
        "dry_sticks": 1468,
        "broken_glass": 1469,
        "red_bead": 1470,
        "cert_red_bead": 1471,
        "yellow_bead": 1472,
        "cert_yellow_bead": 1473,
        "black_bead": 1474,
        "cert_black_bead": 1475,
        "white_bead": 1476,
        "cert_white_bead": 1477,
        "amulet_of_accuracy": 1478,
        "cert_amulet_of_accuracy": 1479,
        "swamprocks1": 1480,
        "caveorb1": 1481,
        "caveorb2": 1482,
        "caveorb3": 1483,
        "caveorb4": 1484,
        "damp_cloth": 1485,
        "caverailing": 1486,
        "cave_unicorn_horn": 1487,
        "paladinbadge1": 1488,
        "paladinbadge2": 1489,
        "paladinbadge3": 1490,
        "cavewitchcat": 1491,
        "ibandoll": 1492,
        "upass_journal": 1493,
        "old_journal": 1494,
        "klanks_gauntlets": 1495,
        "ibansdove": 1496,
        "othainian_amulet": 1497,
        "doomion_amulet": 1498,
        "holthion_amulet": 1499,
        "ibansshadow": 1500,
        "upassdwarfbrew": 1501,
        "ibans_ashes": 1502,
        "warrant": 1503,
        "hangover_cure": 1504,
        "ardougnescroll": 1505,
        "gasmask": 1506,
        "elenakey": 1507,
        "scruffy_note": 1508,
        "turnip_book": 1509,
        "elena_picture": 1510,
        "logs": 1511,
        "cert_logs": 1512,
        "magic_logs": 1513,
        "cert_magic_logs": 1514,
        "yew_logs": 1515,
        "cert_yew_logs": 1516,
        "maple_logs": 1517,
        "cert_maple_logs": 1518,
        "willow_logs": 1519,
        "cert_willow_logs": 1520,
        "oak_logs": 1521,
        "cert_oak_logs": 1522,
        "lockpick": 1523,
        "cert_lockpick": 1524,
        "unidentified_snake_weed": 1525,
        "snake_weed": 1526,
        "unidentified_ardrigal": 1527,
        "ardrigal": 1528,
        "unidentified_sito_foil": 1529,
        "sito_foil": 1530,
        "unidentified_volencia_moss": 1531,
        "volencia_moss": 1532,
        "unidentified_rogues_purse": 1533,
        "rogues_purse": 1534,
        "mappart1": 1535,
        "mappart2": 1536,
        "mappart3": 1537,
        "dragonmap": 1538,
        "nails": 1539,
        "antidragonbreathshield": 1540,
        "cert_antidragonbreathshield": 1541,
        "melzarkey": 1542,
        "redkey": 1543,
        "orangekey": 1544,
        "yellowkey": 1545,
        "bluekey": 1546,
        "magentakey": 1547,
        "greenkey": 1548,
        "stake": 1549,
        "garlic": 1550,
        "cert_garlic": 1551,
        "seasoned_sardine": 1552,
        "cert_seasoned_sardine": 1553,
        "gertrudekittens": 1554,
        "kittenobject": 1555,
        "kittenobject_light": 1556,
        "kittenobject_brown": 1557,
        "kittenobject_black": 1558,
        "kittenobject_browngrey": 1559,
        "kittenobject_bluegrey": 1560,
        "growncatobject": 1561,
        "growncatobject_light": 1562,
        "growncatobject_brown": 1563,
        "growncatobject_black": 1564,
        "growncatobject_browngrey": 1565,
        "growncatobject_bluegrey": 1566,
        "overgrowncatobject": 1567,
        "overgrowncatobject_light": 1568,
        "overgrowncatobject_brown": 1569,
        "overgrowncatobject_black": 1570,
        "overgrowncatobject_browngrey": 1571,
        "overgrowncatobject_bluegrey": 1572,
        "doogleleaves": 1573,
        "cert_doogleleaves": 1574,
        "felinemedal": 1575,
        "cert_felinemedal": 1576,
        "petecandlestick": 1577,
        "cert_petecandlestick": 1578,
        "master_thief_armband": 1579,
        "ice_gloves": 1580,
        "blamish_snail_slime": 1581,
        "blamish_oil": 1582,
        "hot_feather": 1583,
        "id_papers": 1584,
        "oily_fishing_rod": 1585,
        "misc_key": 1586,
        "cert_misc_key": 1587,
        "grip_keys": 1588,
        "obj_1589": 1589,
        "dusty_key": 1590,
        "jail_key": 1591,
        "ring_mould": 1592,
        "cert_ring_mould": 1593,
        "unholy_symbol_mould": 1594,
        "amulet_mould": 1595,
        "cert_amulet_mould": 1596,
        "necklace_mould": 1597,
        "cert_necklace_mould": 1598,
        "holy_symbol_mould": 1599,
        "cert_holy_symbol_mould": 1600,
        "diamond": 1601,
        "cert_diamond": 1602,
        "ruby": 1603,
        "cert_ruby": 1604,
        "emerald": 1605,
        "cert_emerald": 1606,
        "sapphire": 1607,
        "cert_sapphire": 1608,
        "opal": 1609,
        "cert_opal": 1610,
        "jade": 1611,
        "cert_jade": 1612,
        "red_topaz": 1613,
        "cert_red_topaz": 1614,
        "dragonstone": 1615,
        "cert_dragonstone": 1616,
        "uncut_diamond": 1617,
        "cert_uncut_diamond": 1618,
        "uncut_ruby": 1619,
        "cert_uncut_ruby": 1620,
        "uncut_emerald": 1621,
        "cert_uncut_emerald": 1622,
        "uncut_sapphire": 1623,
        "cert_uncut_sapphire": 1624,
        "uncut_opal": 1625,
        "cert_uncut_opal": 1626,
        "uncut_jade": 1627,
        "cert_uncut_jade": 1628,
        "uncut_red_topaz": 1629,
        "cert_uncut_red_topaz": 1630,
        "uncut_dragonstone": 1631,
        "cert_uncut_dragonstone": 1632,
        "crushed_gemstone": 1633,
        "cert_crushed_gemstone": 1634,
        "gold_ring": 1635,
        "cert_gold_ring": 1636,
        "sapphire_ring": 1637,
        "cert_sapphire_ring": 1638,
        "emerald_ring": 1639,
        "cert_emerald_ring": 1640,
        "ruby_ring": 1641,
        "cert_ruby_ring": 1642,
        "diamond_ring": 1643,
        "cert_diamond_ring": 1644,
        "dragonstone_ring": 1645,
        "cert_dragonstone_ring": 1646,
        "black_ring": 1647,
        "cert_black_ring": 1648,
        "invis_ring1": 1649,
        "invis_ring2": 1650,
        "invis_ring3": 1651,
        "invis_ring4": 1652,
        "invis_ring5": 1653,
        "gold_necklace": 1654,
        "cert_gold_necklace": 1655,
        "sapphire_necklace": 1656,
        "cert_sapphire_necklace": 1657,
        "emerald_necklace": 1658,
        "cert_emerald_necklace": 1659,
        "ruby_necklace": 1660,
        "cert_ruby_necklace": 1661,
        "diamond_necklace": 1662,
        "cert_diamond_necklace": 1663,
        "dragonstone_necklace": 1664,
        "cert_dragonstone_necklace": 1665,
        "black_necklace": 1666,
        "cert_black_necklace": 1667,
        "invis_necklace1": 1668,
        "invis_necklace2": 1669,
        "invis_necklace3": 1670,
        "invis_necklace4": 1671,
        "invis_necklace5": 1672,
        "unstrung_gold_amulet": 1673,
        "cert_unstrung_gold_amulet": 1674,
        "unstrung_sapphire_amulet": 1675,
        "cert_unstrung_sapphire_amulet": 1676,
        "unstrung_emerald_amulet": 1677,
        "cert_unstrung_emerald_amulet": 1678,
        "unstrung_ruby_amulet": 1679,
        "cert_unstrung_ruby_amulet": 1680,
        "unstrung_diamond_amulet": 1681,
        "cert_unstrung_diamond_amulet": 1682,
        "unstrung_dragonstone_amulet": 1683,
        "cert_unstrung_dragonstone_amulet": 1684,
        "black_amulet": 1685,
        "cert_black_amulet": 1686,
        "invis_amulet1": 1687,
        "invis_amulet2": 1688,
        "invis_amulet3": 1689,
        "invis_amulet4": 1690,
        "invis_amulet5": 1691,
        "strung_gold_amulet": 1692,
        "cert_strung_gold_amulet": 1693,
        "strung_sapphire_amulet": 1694,
        "cert_strung_sapphire_amulet": 1695,
        "strung_emerald_amulet": 1696,
        "cert_strung_emerald_amulet": 1697,
        "strung_ruby_amulet": 1698,
        "cert_strung_ruby_amulet": 1699,
        "strung_diamond_amulet": 1700,
        "cert_strung_diamond_amulet": 1701,
        "strung_dragonstone_amulet": 1702,
        "cert_strung_dragonstone_amulet": 1703,
        "amulet_of_glory": 1704,
        "cert_amulet_of_glory": 1705,
        "amulet_of_glory_1": 1706,
        "cert_amulet_of_glory_1": 1707,
        "amulet_of_glory_2": 1708,
        "cert_amulet_of_glory_2": 1709,
        "amulet_of_glory_3": 1710,
        "cert_amulet_of_glory_3": 1711,
        "amulet_of_glory_4": 1712,
        "cert_amulet_of_glory_4": 1713,
        "nostringstar": 1714,
        "cert_nostringstar": 1715,
        "stringstar": 1716,
        "cert_stringstar": 1717,
        "blessedstar": 1718,
        "cert_blessedstar": 1719,
        "nostringsnake": 1720,
        "cert_nostringsnake": 1721,
        "stringsnake": 1722,
        "cert_stringsnake": 1723,
        "blessedsnake": 1724,
        "amulet_of_strength": 1725,
        "cert_amulet_of_strength": 1726,
        "amulet_of_magic": 1727,
        "cert_amulet_of_magic": 1728,
        "amulet_of_defence": 1729,
        "cert_amulet_of_defence": 1730,
        "amulet_of_power": 1731,
        "cert_amulet_of_power": 1732,
        "needle": 1733,
        "thread": 1734,
        "shears": 1735,
        "cert_shears": 1736,
        "wool": 1737,
        "cert_wool": 1738,
        "cow_hide": 1739,
        "cert_cow_hide": 1740,
        "leather": 1741,
        "cert_leather": 1742,
        "hard_leather": 1743,
        "cert_hard_leather": 1744,
        "dragon_leather": 1745,
        "cert_dragon_leather": 1746,
        "dragonhide_black": 1747,
        "cert_dragonhide_black": 1748,
        "dragonhide_red": 1749,
        "cert_dragonhide_red": 1750,
        "dragonhide_blue": 1751,
        "cert_dragonhide_blue": 1752,
        "dragonhide_green": 1753,
        "cert_dragonhide_green": 1754,
        "chisel": 1755,
        "cert_chisel": 1756,
        "brown_apron": 1757,
        "cert_brown_apron": 1758,
        "ball_of_wool": 1759,
        "cert_ball_of_wool": 1760,
        "softclay": 1761,
        "cert_softclay": 1762,
        "reddye": 1763,
        "cert_reddye": 1764,
        "yellowdye": 1765,
        "cert_yellowdye": 1766,
        "bluedye": 1767,
        "cert_bluedye": 1768,
        "orangedye": 1769,
        "cert_orangedye": 1770,
        "greendye": 1771,
        "cert_greendye": 1772,
        "purpledye": 1773,
        "cert_purpledye": 1774,
        "molten_glass": 1775,
        "cert_molten_glass": 1776,
        "bow_string": 1777,
        "cert_bow_string": 1778,
        "flax": 1779,
        "cert_flax": 1780,
        "soda_ash": 1781,
        "cert_soda_ash": 1782,
        "bucket_sand": 1783,
        "cert_bucket_sand": 1784,
        "glassblowingpipe": 1785,
        "cert_glassblowingpipe": 1786,
        "pot_unfired": 1787,
        "cert_pot_unfired": 1788,
        "piedish_unfired": 1789,
        "cert_piedish_unfired": 1790,
        "bowl_unfired": 1791,
        "cert_bowl_unfired": 1792,
        "woadleaf": 1793,
        "bronzecraftwire": 1794,
        "cert_bronzecraftwire": 1795,
        "murdernecklace": 1796,
        "murdernecklacedust": 1797,
        "murdercup": 1798,
        "murdercupdust": 1799,
        "murderbottle": 1800,
        "murderbottledust": 1801,
        "murderbook": 1802,
        "murderbookdust": 1803,
        "murderneedle": 1804,
        "murderneedledust": 1805,
        "murderpot": 1806,
        "murderpotdust": 1807,
        "murderthreadr": 1808,
        "murderthreadg": 1809,
        "murderthreadb": 1810,
        "murderpaper": 1811,
        "murderpot2": 1812,
        "murderweapon": 1813,
        "murderweapondust": 1814,
        "murderfingerprint": 1815,
        "murderfingerprinta": 1816,
        "murderfingerprintb": 1817,
        "murderfingerprintc": 1818,
        "murderfingerprintd": 1819,
        "murderfingerprinte": 1820,
        "murderfingerprintf": 1821,
        "murderfingerprint1": 1822,
        "water_skin4": 1823,
        "cert_water_skin4": 1824,
        "water_skin3": 1825,
        "cert_water_skin3": 1826,
        "water_skin2": 1827,
        "cert_water_skin2": 1828,
        "water_skin1": 1829,
        "cert_water_skin1": 1830,
        "water_skin0": 1831,
        "cert_water_skin0": 1832,
        "desert_shirt": 1833,
        "cert_desert_shirt": 1834,
        "desert_robe": 1835,
        "cert_desert_robe": 1836,
        "desert_boots": 1837,
        "cert_desert_boots": 1838,
        "metal_key": 1839,
        "thcelldoorkey": 1840,
        "thminebarrel_empty": 1841,
        "thanainabarrel": 1842,
        "thgoodminekey": 1843,
        "slave_shirt": 1844,
        "slave_robe": 1845,
        "slave_boots": 1846,
        "thkebabinstructs": 1847,
        "thshantaydisc": 1848,
        "thprotodart": 1849,
        "thcaptplans": 1850,
        "tentipineapple": 1851,
        "thbedobinkey": 1852,
        "thprotodarttip": 1853,
        "shantay_pass": 1854,
        "thpunishrock": 1855,
        "ardougne_book": 1856,
        "tribal_totem": 1857,
        "tribal_totem_label": 1858,
        "raw_ugthanki_meat": 1859,
        "cert_raw_ugthanki_meat": 1860,
        "cooked_ugthanki_meat": 1861,
        "cert_cooked_ugthanki_meat": 1862,
        "uncooked_pitta_bread": 1863,
        "cert_uncooked_pitta_bread": 1864,
        "pitta_bread": 1865,
        "cert_pitta_bread": 1866,
        "burnt_pitta_bread": 1867,
        "cert_burnt_pitta_bread": 1868,
        "bowl_tomato": 1869,
        "cert_bowl_tomato": 1870,
        "bowl_onion": 1871,
        "cert_bowl_onion": 1872,
        "bowl_ugthanki": 1873,
        "cert_bowl_ugthanki": 1874,
        "bowl_oniontomato": 1875,
        "cert_bowl_oniontomato": 1876,
        "bowl_ugthankionion": 1877,
        "cert_bowl_ugthankionion": 1878,
        "bowl_ugthankitomato": 1879,
        "cert_bowl_ugthankitomato": 1880,
        "bowl_oniontomugthanki": 1881,
        "cert_bowl_oniontomugthanki": 1882,
        "ugthanki_kebab_bad": 1883,
        "cert_ugthanki_kebab_bad": 1884,
        "ugthanki_kebab": 1885,
        "cert_ugthanki_kebab": 1886,
        "cake_tin": 1887,
        "cert_cake_tin": 1888,
        "uncooked_cake": 1889,
        "cert_uncooked_cake": 1890,
        "cake": 1891,
        "cert_cake": 1892,
        "partial_cake": 1893,
        "cert_partial_cake": 1894,
        "cake_slice": 1895,
        "cert_cake_slice": 1896,
        "chocolate_cake": 1897,
        "cert_chocolate_cake": 1898,
        "partial_chocolate_cake": 1899,
        "cert_partial_chocolate_cake": 1900,
        "chocolate_slice": 1901,
        "cert_chocolate_slice": 1902,
        "burnt_cake": 1903,
        "cert_burnt_cake": 1904,
        "asgarnian_ale": 1905,
        "cert_asgarnian_ale": 1906,
        "wizards_mind_bomb": 1907,
        "cert_wizards_mind_bomb": 1908,
        "greenmans_ale": 1909,
        "cert_greenmans_ale": 1910,
        "dragon_bitter": 1911,
        "cert_dragon_bitter": 1912,
        "dwarven_stout": 1913,
        "cert_dwarven_stout": 1914,
        "grog": 1915,
        "cert_grog": 1916,
        "beer": 1917,
        "cert_beer": 1918,
        "beer_glass": 1919,
        "cert_beer_glass": 1920,
        "bowl_water": 1921,
        "cert_bowl_water": 1922,
        "bowl_empty": 1923,
        "cert_bowl_empty": 1924,
        "bucket_empty": 1925,
        "cert_bucket_empty": 1926,
        "bucket_milk": 1927,
        "cert_bucket_milk": 1928,
        "bucket_water": 1929,
        "cert_bucket_water": 1930,
        "pot_empty": 1931,
        "cert_pot_empty": 1932,
        "pot_flour": 1933,
        "cert_pot_flour": 1934,
        "jug_empty": 1935,
        "cert_jug_empty": 1936,
        "jug_water": 1937,
        "cert_jug_water": 1938,
        "swamp_tar": 1939,
        "rawswamppaste": 1940,
        "swamppaste": 1941,
        "potato": 1942,
        "cert_potato": 1943,
        "egg": 1944,
        "cert_egg": 1945,
        "flour": 1946,
        "grain": 1947,
        "cert_grain": 1948,
        "chefs_hat": 1949,
        "cert_chefs_hat": 1950,
        "redberries": 1951,
        "cert_redberries": 1952,
        "pastry_dough": 1953,
        "cert_pastry_dough": 1954,
        "cooking_apple": 1955,
        "cert_cooking_apple": 1956,
        "onion": 1957,
        "cert_onion": 1958,
        "pumpkin": 1959,
        "cert_pumpkin": 1960,
        "easter_egg": 1961,
        "cert_easter_egg": 1962,
        "banana": 1963,
        "cert_banana": 1964,
        "cabbage": 1965,
        "cert_cabbage": 1966,
        "magic_cabbage": 1967,
        "cert_magic_cabbage": 1968,
        "spinach_roll": 1969,
        "cert_spinach_roll": 1970,
        "kebab": 1971,
        "cert_kebab": 1972,
        "chocolate_bar": 1973,
        "cert_chocolate_bar": 1974,
        "chocolate_dust": 1975,
        "cert_chocolate_dust": 1976,
        "chocolaty_milk": 1977,
        "cup_of_tea": 1978,
        "cert_cup_of_tea": 1979,
        "cup_empty": 1980,
        "cert_cup_empty": 1981,
        "tomato": 1982,
        "cert_tomato": 1983,
        "rottenapples": 1984,
        "cheese": 1985,
        "cert_cheese": 1986,
        "grapes": 1987,
        "cert_grapes": 1988,
        "half_full_wine_jug": 1989,
        "cert_half_full_wine_jug": 1990,
        "jug_bad_wine": 1991,
        "cert_jug_bad_wine": 1992,
        "jug_wine": 1993,
        "cert_jug_wine": 1994,
        "jug_unfermented_wine": 1995,
        "cert_jug_unfermented_wine": 1996,
        "stew1": 1997,
        "cert_stew1": 1998,
        "stew2": 1999,
        "cert_stew2": 2000,
        "uncooked_stew": 2001,
        "cert_uncooked_stew": 2002,
        "stew": 2003,
        "cert_stew": 2004,
        "burnt_stew": 2005,
        "cert_burnt_stew": 2006,
        "spicespot": 2007,
        "cert_spicespot": 2008,
        "uncooked_curry": 2009,
        "cert_uncooked_curry": 2010,
        "curry": 2011,
        "cert_curry": 2012,
        "burnt_curry": 2013,
        "cert_burnt_curry": 2014,
        "vodka": 2015,
        "cert_vodka": 2016,
        "whisky": 2017,
        "cert_whisky": 2018,
        "gin": 2019,
        "cert_gin": 2020,
        "brandy": 2021,
        "cert_brandy": 2022,
        "cocktail_guide": 2023,
        "cert_cocktail_guide": 2024,
        "cocktail_shaker": 2025,
        "cocktail_glass_empty": 2026,
        "cert_cocktail_glass_empty": 2027,
        "premade_blurberry_special": 2028,
        "cert_premade_blurberry_special": 2029,
        "premade_choc_saturday": 2030,
        "cert_premade_choc_saturday": 2031,
        "premade_drunk_dragon": 2032,
        "cert_premade_drunk_dragon": 2033,
        "premade_fruit_blast": 2034,
        "cert_premade_fruit_blast": 2035,
        "premade_pineapple_punch": 2036,
        "cert_premade_pineapple_punch": 2037,
        "premade_sgg": 2038,
        "cert_premade_sgg": 2039,
        "premade_wizard_blizzard": 2040,
        "cert_premade_wizard_blizzard": 2041,
        "unfinished_pineapple_punch1": 2042,
        "cert_unfinished_pineapple_punch1": 2043,
        "unfinished_pineapple_punch2": 2044,
        "cert_unfinished_pineapple_punch2": 2045,
        "unfinished_pineapple_punch3": 2046,
        "cert_unfinished_pineapple_punch3": 2047,
        "pineapple_punch": 2048,
        "cert_pineapple_punch": 2049,
        "unfinished_wizard_blizzard1": 2050,
        "cert_unfinished_wizard_blizzard1": 2051,
        "unfinished_wizard_blizzard2": 2052,
        "cert_unfinished_wizard_blizzard2": 2053,
        "wizard_blizzard": 2054,
        "cert_wizard_blizzard": 2055,
        "unfinished_blurberry_special1": 2056,
        "cert_unfinished_blurberry_special1": 2057,
        "unfinished_blurberry_special2": 2058,
        "cert_unfinished_blurberry_special2": 2059,
        "unfinished_blurberry_special3": 2060,
        "cert_unfinished_blurberry_special3": 2061,
        "unfinished_blurberry_special4": 2062,
        "cert_unfinished_blurberry_special4": 2063,
        "blurberry_special": 2064,
        "cert_blurberry_special": 2065,
        "unfinished_chocolate_saturday1": 2066,
        "cert_unfinished_chocolate_saturday1": 2067,
        "unfinished_chocolate_saturday2": 2068,
        "cert_unfinished_chocolate_saturday2": 2069,
        "unfinished_chocolate_saturday3": 2070,
        "cert_unfinished_chocolate_saturday3": 2071,
        "unfinished_chocolate_saturday4": 2072,
        "cert_unfinished_chocolate_saturday4": 2073,
        "chocolate_saturday": 2074,
        "cert_chocolate_saturday": 2075,
        "unfinished_sgg1": 2076,
        "cert_unfinished_sgg1": 2077,
        "unfinished_sgg2": 2078,
        "cert_unfinished_sgg2": 2079,
        "sgg": 2080,
        "cert_sgg": 2081,
        "unfinished_fruit_blast1": 2082,
        "cert_unfinished_fruit_blast1": 2083,
        "fruit_blast": 2084,
        "cert_fruit_blast": 2085,
        "unfinished_drunk_dragon1": 2086,
        "cert_unfinished_drunk_dragon1": 2087,
        "unfinished_drunk_dragon2": 2088,
        "cert_unfinished_drunk_dragon2": 2089,
        "unfinished_drunk_dragon3": 2090,
        "cert_unfinished_drunk_dragon3": 2091,
        "drunk_dragon": 2092,
        "cert_drunk_dragon": 2093,
        "spoilt_cocktail": 2094,
        "cert_spoilt_cocktail": 2095,
        "spoilt_cocktail_fruity": 2096,
        "cert_spoilt_cocktail_fruity": 2097,
        "spoilt_cocktail_creamy": 2098,
        "cert_spoilt_cocktail_creamy": 2099,
        "spoilt_cocktail_slice": 2100,
        "cert_spoilt_cocktail_slice": 2101,
        "lemon": 2102,
        "cert_lemon": 2103,
        "lemon_chunks": 2104,
        "cert_lemon_chunks": 2105,
        "lemon_slices": 2106,
        "cert_lemon_slices": 2107,
        "orange": 2108,
        "cert_orange": 2109,
        "orange_chunks": 2110,
        "cert_orange_chunks": 2111,
        "orange_slices": 2112,
        "cert_orange_slices": 2113,
        "pineapple": 2114,
        "cert_pineapple": 2115,
        "pineapple_chunks": 2116,
        "cert_pineapple_chunks": 2117,
        "pineapple_ring": 2118,
        "cert_pineapple_ring": 2119,
        "lime": 2120,
        "cert_lime": 2121,
        "lime_chunks": 2122,
        "cert_lime_chunks": 2123,
        "lime_slices": 2124,
        "cert_lime_slices": 2125,
        "dwellberries": 2126,
        "cert_dwellberries": 2127,
        "equa_leaves": 2128,
        "cert_equa_leaves": 2129,
        "pot_of_cream": 2130,
        "cert_pot_of_cream": 2131,
        "raw_beef": 2132,
        "cert_raw_beef": 2133,
        "raw_rat_meat": 2134,
        "cert_raw_rat_meat": 2135,
        "raw_bear_meat": 2136,
        "cert_raw_bear_meat": 2137,
        "raw_chicken": 2138,
        "cert_raw_chicken": 2139,
        "cooked_chicken": 2140,
        "cert_cooked_chicken": 2141,
        "cooked_meat": 2142,
        "cert_cooked_meat": 2143,
        "burnt_chicken": 2144,
        "cert_burnt_chicken": 2145,
        "burnt_meat": 2146,
        "cert_burnt_meat": 2147,
        "raw_lava_eel": 2148,
        "lava_eel": 2149,
        "swamp_toad": 2150,
        "cert_swamp_toad": 2151,
        "toads_legs": 2152,
        "cert_toads_legs": 2153,
        "equa_toads_legs": 2154,
        "cert_equa_toads_legs": 2155,
        "spicy_toads_legs": 2156,
        "cert_spicy_toads_legs": 2157,
        "seasoned_toads_legs": 2158,
        "cert_seasoned_toads_legs": 2159,
        "spicy_worm": 2160,
        "cert_spicy_worm": 2161,
        "king_worm": 2162,
        "cert_king_worm": 2163,
        "batta_tin": 2164,
        "crunchy_tray": 2165,
        "gnomebowl_mould": 2166,
        "giannes_cook_book": 2167,
        "cert_giannes_cook_book": 2168,
        "gnome_spice": 2169,
        "cert_gnome_spice": 2170,
        "gianne_dough": 2171,
        "cert_gianne_dough": 2172,
        "spoilt_gnomebowl": 2173,
        "cert_spoilt_gnomebowl": 2174,
        "burnt_gnomebowl": 2175,
        "cert_burnt_gnomebowl": 2176,
        "half_baked_bowl": 2177,
        "raw_gnomebowl": 2178,
        "unfinished_chocolate_bomb1": 2179,
        "cert_unfinished_chocolate_bomb1": 2180,
        "unfinished_chocolate_bomb2": 2181,
        "cert_unfinished_chocolate_bomb2": 2182,
        "unfinished_chocolate_bomb3": 2183,
        "cert_unfinished_chocolate_bomb3": 2184,
        "chocolate_bomb": 2185,
        "cert_chocolate_bomb": 2186,
        "tangled_toads_legs": 2187,
        "cert_tangled_toads_legs": 2188,
        "unfinished_worm_hole": 2189,
        "cert_unfinished_worm_hole": 2190,
        "worm_hole": 2191,
        "cert_worm_hole": 2192,
        "unfinished_veg_ball": 2193,
        "cert_unfinished_veg_ball": 2194,
        "veg_ball": 2195,
        "cert_veg_ball": 2196,
        "spoilt_crunchies": 2197,
        "cert_spoilt_crunchies": 2198,
        "burnt_crunchies": 2199,
        "cert_burnt_crunchies": 2200,
        "half_baked_crunchy": 2201,
        "raw_crunchies": 2202,
        "unfinished_worm_crunchies": 2203,
        "cert_unfinished_worm_crunchies": 2204,
        "worm_crunchies": 2205,
        "cert_worm_crunchies": 2206,
        "unfinished_chocchip_crunchies": 2207,
        "cert_unfinished_chocchip_crunchies": 2208,
        "chocchip_crunchies": 2209,
        "cert_chocchip_crunchies": 2210,
        "unfinished_spicy_crunchies": 2211,
        "cert_unfinished_spicy_crunchies": 2212,
        "spicy_crunchies": 2213,
        "cert_spicy_crunchies": 2214,
        "unfinished_toad_crunchies": 2215,
        "cert_unfinished_toad_crunchies": 2216,
        "toad_crunchies": 2217,
        "cert_toad_crunchies": 2218,
        "premade_worm_batta": 2219,
        "cert_premade_worm_batta": 2220,
        "premade_toad_batta": 2221,
        "cert_premade_toad_batta": 2222,
        "premade_cheese_tom_batta": 2223,
        "cert_premade_cheese_tom_batta": 2224,
        "premade_fruit_batta": 2225,
        "cert_premade_fruit_batta": 2226,
        "premade_vegetable_batta": 2227,
        "cert_premade_vegetable_batta": 2228,
        "premade_chocolate_bomb": 2229,
        "cert_premade_chocolate_bomb": 2230,
        "premade_tangled_toads_legs": 2231,
        "cert_premade_tangled_toads_legs": 2232,
        "premade_worm_hole": 2233,
        "cert_premade_worm_hole": 2234,
        "premade_veg_ball": 2235,
        "cert_premade_veg_ball": 2236,
        "premade_worm_crunchies": 2237,
        "cert_premade_worm_crunchies": 2238,
        "premade_chocchip_crunchies": 2239,
        "cert_premade_chocchip_crunchies": 2240,
        "premade_spicy_crunchies": 2241,
        "cert_premade_spicy_crunchies": 2242,
        "premade_toad_crunchies": 2243,
        "cert_premade_toad_crunchies": 2244,
        "spoilt_batta": 2245,
        "cert_spoilt_batta": 2246,
        "burnt_batta": 2247,
        "cert_burnt_batta": 2248,
        "half_baked_batta": 2249,
        "raw_batta": 2250,
        "unfinished_worm_batta": 2251,
        "cert_unfinished_worm_batta": 2252,
        "worm_batta": 2253,
        "cert_worm_batta": 2254,
        "toad_batta": 2255,
        "cert_toad_batta": 2256,
        "unfinished_cheese_tom_batta": 2257,
        "cert_unfinished_cheese_tom_batta": 2258,
        "cheese_tom_batta": 2259,
        "cert_cheese_tom_batta": 2260,
        "fruitless_batta": 2261,
        "cert_fruitless_batta": 2262,
        "fruit_batta_lime": 2263,
        "cert_fruit_batta_lime": 2264,
        "fruit_batta_orange": 2265,
        "cert_fruit_batta_orange": 2266,
        "fruit_batta_pineapple": 2267,
        "cert_fruit_batta_pineapple": 2268,
        "fruit_batta_limeorange": 2269,
        "cert_fruit_batta_limeorange": 2270,
        "fruit_batta_limepineapple": 2271,
        "cert_fruit_batta_limepineapple": 2272,
        "fruit_batta_orangepineapple": 2273,
        "cert_fruit_batta_orangepineapple": 2274,
        "unfinished_fruit_batta": 2275,
        "cert_unfinished_fruit_batta": 2276,
        "fruit_batta": 2277,
        "cert_fruit_batta": 2278,
        "unfinished_vegetable_batta": 2279,
        "cert_unfinished_vegetable_batta": 2280,
        "vegetable_batta": 2281,
        "cert_vegetable_batta": 2282,
        "pizza_base": 2283,
        "cert_pizza_base": 2284,
        "incomplete_pizza": 2285,
        "cert_incomplete_pizza": 2286,
        "uncooked_pizza": 2287,
        "cert_uncooked_pizza": 2288,
        "plain_pizza": 2289,
        "cert_plain_pizza": 2290,
        "half_plain_pizza": 2291,
        "cert_half_plain_pizza": 2292,
        "meat_pizza": 2293,
        "cert_meat_pizza": 2294,
        "half_meat_pizza": 2295,
        "cert_half_meat_pizza": 2296,
        "anchovie_pizza": 2297,
        "cert_anchovie_pizza": 2298,
        "half_anchovie_pizza": 2299,
        "cert_half_anchovie_pizza": 2300,
        "pineapple_pizza": 2301,
        "cert_pineapple_pizza": 2302,
        "half_pineapple_pizza": 2303,
        "cert_half_pineapple_pizza": 2304,
        "burnt_pizza": 2305,
        "cert_burnt_pizza": 2306,
        "bread_dough": 2307,
        "cert_bread_dough": 2308,
        "bread": 2309,
        "cert_bread": 2310,
        "burnt_bread": 2311,
        "cert_burnt_bread": 2312,
        "piedish": 2313,
        "cert_piedish": 2314,
        "pie_shell": 2315,
        "cert_pie_shell": 2316,
        "uncooked_apple_pie": 2317,
        "cert_uncooked_apple_pie": 2318,
        "uncooked_meat_pie": 2319,
        "cert_uncooked_meat_pie": 2320,
        "uncooked_redberry_pie": 2321,
        "cert_uncooked_redberry_pie": 2322,
        "apple_pie": 2323,
        "cert_apple_pie": 2324,
        "redberry_pie": 2325,
        "cert_redberry_pie": 2326,
        "meat_pie": 2327,
        "cert_meat_pie": 2328,
        "burnt_pie": 2329,
        "cert_burnt_pie": 2330,
        "half_a_meat_pie": 2331,
        "cert_half_a_meat_pie": 2332,
        "half_a_redberry_pie": 2333,
        "cert_half_a_redberry_pie": 2334,
        "half_an_apple_pie": 2335,
        "cert_half_an_apple_pie": 2336,
        "raw_oomlie": 2337,
        "cert_raw_oomlie": 2338,
        "palm_leaf": 2339,
        "cert_palm_leaf": 2340,
        "wrapped_oomlie": 2341,
        "cert_wrapped_oomlie": 2342,
        "cooked_oomlie": 2343,
        "cert_cooked_oomlie": 2344,
        "burnt_oomlie": 2345,
        "cert_burnt_oomlie": 2346,
        "hammer": 2347,
        "cert_hammer": 2348,
        "bronze_bar": 2349,
        "cert_bronze_bar": 2350,
        "iron_bar": 2351,
        "cert_iron_bar": 2352,
        "steel_bar": 2353,
        "cert_steel_bar": 2354,
        "silver_bar": 2355,
        "cert_silver_bar": 2356,
        "gold_bar": 2357,
        "cert_gold_bar": 2358,
        "mithril_bar": 2359,
        "cert_mithril_bar": 2360,
        "adamantite_bar": 2361,
        "cert_adamantite_bar": 2362,
        "runite_bar": 2363,
        "cert_runite_bar": 2364,
        "perfect_gold_bar": 2365,
        "dragonshield_a": 2366,
        "cert_dragonshield_a": 2367,
        "dragonshield_b": 2368,
        "cert_dragonshield_b": 2369,
        "studs": 2370,
        "cert_studs": 2371,
        "ogrerelic": 2372,
        "relicpart1": 2373,
        "relicpart2": 2374,
        "relicpart3": 2375,
        "skavidmap": 2376,
        "ogretooth": 2377,
        "toban_key": 2378,
        "rockcake": 2379,
        "powering_crystal1": 2380,
        "powering_crystal2": 2381,
        "powering_crystal3": 2382,
        "powering_crystal4": 2383,
        "fingernails": 2384,
        "watchtowerrobe": 2385,
        "watchtowerarmour": 2386,
        "watchtowerdagger": 2387,
        "watch_eye_patch": 2388,
        "jangervial": 2389,
        "guamjangervial": 2390,
        "ground_bat_bones": 2391,
        "cert_ground_bat_bones": 2392,
        "stolen_gold": 2393,
        "ogre_potion": 2394,
        "magic_ogre_potion": 2395,
        "watchtowerspell": 2396,
        "shaman_robe": 2397,
        "nightshade": 2398,
        "silverlight_key_1": 2399,
        "silverlight_key_2": 2400,
        "silverlight_key_3": 2401,
        "silverlight": 2402,
        "hazeel_scroll": 2403,
        "carnilleanchestkey": 2404,
        "carnillean_armour": 2405,
        "mark_of_hazeel": 2406,
        "ball": 2407,
        "witches_diary": 2408,
        "witches_doorkey": 2409,
        "magnet": 2410,
        "witches_shedkey": 2411,
        "saradomin_cape": 2412,
        "guthix_cape": 2413,
        "zamorak_cape": 2414,
        "saradomin_staff": 2415,
        "guthix_staff": 2416,
        "zamorak_staff": 2417,
        "princeskey": 2418,
        "blondwig": 2419,
        "obj_2420": 2420,
        "plainwig": 2421,
        "obj_2422": 2422,
        "keyprint": 2423,
        "skinpaste": 2424,
        "obj_2425": 2425,
        "burnt_uw_oomlie": 2426,
        "cert_burnt_uw_oomlie": 2427,
        "4dose1attack": 2428,
        "cert_4dose1attack": 2429,
        "4dosestatrestore": 2430,
        "cert_4dosestatrestore": 2431,
        "4dose1defense": 2432,
        "cert_4dose1defense": 2433,
        "4doseprayerrestore": 2434,
        "cert_4doseprayerrestore": 2435,
        "4dose2attack": 2436,
        "cert_4dose2attack": 2437,
        "4dosefisherspotion": 2438,
        "cert_4dosefisherspotion": 2439,
        "4dose2strength": 2440,
        "cert_4dose2strength": 2441,
        "4dose2defense": 2442,
        "cert_4dose2defense": 2443,
        "4doserangerspotion": 2444,
        "cert_4doserangerspotion": 2445,
        "4doseantipoison": 2446,
        "cert_4doseantipoison": 2447,
        "4dose2antipoison": 2448,
        "cert_4dose2antipoison": 2449,
        "4dosepotionofzamorak": 2450,
        "cert_4dosepotionofzamorak": 2451,
        "4dose1antidragon": 2452,
        "cert_4dose1antidragon": 2453,
        "3dose1antidragon": 2454,
        "cert_3dose1antidragon": 2455,
        "2dose1antidragon": 2456,
        "cert_2dose1antidragon": 2457,
        "1dose1antidragon": 2458,
        "cert_1dose1antidragon": 2459,
        "flowers_waterfall_quest": 2460,
        "cert_flowers_waterfall_quest": 2461,
        "flowers_waterfall_quest_red": 2462,
        "cert_flowers_waterfall_quest_red": 2463,
        "flowers_waterfall_quest_blue": 2464,
        "cert_flowers_waterfall_quest_blue": 2465,
        "flowers_waterfall_quest_yellow": 2466,
        "cert_flowers_waterfall_quest_yellow": 2467,
        "flowers_waterfall_quest_purple": 2468,
        "cert_flowers_waterfall_quest_purple": 2469,
        "flowers_waterfall_quest_orange": 2470,
        "cert_flowers_waterfall_quest_orange": 2471,
        "flowers_waterfall_quest_mixed": 2472,
        "cert_flowers_waterfall_quest_mixed": 2473,
        "flowers_waterfall_quest_white": 2474,
        "cert_flowers_waterfall_quest_white": 2475,
        "flowers_waterfall_quest_black": 2476,
        "cert_flowers_waterfall_quest_black": 2477,
        "cert_fish_food": 2478,
        "cert_poison": 2479,
        "obj_2480": 2480,
        "lantadyme": 2481,
        "cert_lantadyme": 2482,
        "lantadymevial": 2483,
        "cert_lantadymevial": 2484,
        "unidentified_lantadyme": 2485,
        "cert_unidentified_lantadyme": 2486,
        "blue_dragon_vambraces": 2487,
        "cert_blue_dragon_vambraces": 2488,
        "red_dragon_vambraces": 2489,
        "cert_red_dragon_vambraces": 2490,
        "black_dragon_vambraces": 2491,
        "cert_black_dragon_vambraces": 2492,
        "blue_dragonhide_chaps": 2493,
        "cert_blue_dragonhide_chaps": 2494,
        "red_dragonhide_chaps": 2495,
        "cert_red_dragonhide_chaps": 2496,
        "black_dragonhide_chaps": 2497,
        "cert_black_dragonhide_chaps": 2498,
        "blue_dragonhide_body": 2499,
        "cert_blue_dragonhide_body": 2500,
        "red_dragonhide_body": 2501,
        "cert_red_dragonhide_body": 2502,
        "black_dragonhide_body": 2503,
        "cert_black_dragonhide_body": 2504,
        "dragon_leather_blue": 2505,
        "cert_dragon_leather_blue": 2506,
        "dragon_leather_red": 2507,
        "cert_dragon_leather_red": 2508,
        "dragon_leather_black": 2509,
        "cert_dragon_leather_black": 2510,
        "newbielogs": 2511,
        "newbieshrimp": 2512,
        "obj_2513": 2513,
        "newbieraw_shrimp": 2514,
        "cert_newbieraw_shrimp": 2515,
        "newbie_pot_flour": 2516,
        "cert_newbie_pot_flour": 2517,
        "rotten_tomato": 2518,
        "cert_rotten_tomato": 2519,
        "horsey_brown": 2520,
        "cert_horsey_brown": 2521,
        "horsey_white": 2522,
        "cert_horsey_white": 2523,
        "horsey_black": 2524,
        "cert_horsey_black": 2525,
        "horsey_grey": 2526,
        "cert_horsey_grey": 2527,
        "macro_genilamp": 2528,
        "caveorb4dot": 2529,
        "newbiebones": 2530,
        "cert_newbiebones": 2531,
        "iron_unlitarrow": 2532,
        "iron_litarrow": 2533,
        "steel_unlitarrow": 2534,
        "steel_litarrow": 2535,
        "mithril_unlitarrow": 2536,
        "mithril_litarrow": 2537,
        "adamant_unlitarrow": 2538,
        "adamant_litarrow": 2539,
        "rune_unlitarrow": 2540,
        "rune_litarrow": 2541,
        "unlitarrow_2": 2542,
        "unlitarrow_3": 2543,
        "unlitarrow_4": 2544,
        "unlitarrow_5": 2545,
        "litarrow_2": 2546,
        "litarrow_3": 2547,
        "litarrow_4": 2548,
        "litarrow_5": 2549,
        "ring_of_recoil": 2550,
        "cert_ring_of_recoil": 2551,
        "ring_of_dueling_8": 2552,
        "cert_ring_of_dueling_8": 2553,
        "ring_of_dueling_7": 2554,
        "cert_ring_of_dueling_7": 2555,
        "ring_of_dueling_6": 2556,
        "cert_ring_of_dueling_6": 2557,
        "ring_of_dueling_5": 2558,
        "cert_ring_of_dueling_5": 2559,
        "ring_of_dueling_4": 2560,
        "cert_ring_of_dueling_4": 2561,
        "ring_of_dueling_3": 2562,
        "cert_ring_of_dueling_3": 2563,
        "ring_of_dueling_2": 2564,
        "cert_ring_of_dueling_2": 2565,
        "ring_of_dueling_1": 2566,
        "cert_ring_of_dueling_1": 2567,
        "ring_of_forging": 2568,
        "cert_ring_of_forging": 2569,
        "ring_of_life": 2570,
        "cert_ring_of_life": 2571,
        "ring_of_wealth": 2572,
        "cert_ring_of_wealth": 2573,
        "trail_sextant": 2574,
        "trail_watch": 2575,
        "trail_chart": 2576,
        "boots_ranger": 2577,
        "cert_boots_ranger": 2578,
        "boots_wizard": 2579,
        "cert_boots_wizard": 2580,
        "robinhoodhat": 2581,
        "cert_robinhoodhat": 2582,
        "black_platebody_trim": 2583,
        "cert_black_platebody_trim": 2584,
        "black_platelegs_trim": 2585,
        "cert_black_platelegs_trim": 2586,
        "black_full_helm_trim": 2587,
        "cert_black_full_helm_trim": 2588,
        "black_kiteshield_trim": 2589,
        "cert_black_kiteshield_trim": 2590,
        "black_platebody_gold": 2591,
        "cert_black_platebody_gold": 2592,
        "black_platelegs_gold": 2593,
        "cert_black_platelegs_gold": 2594,
        "black_full_helm_gold": 2595,
        "cert_black_full_helm_gold": 2596,
        "black_kiteshield_gold": 2597,
        "cert_black_kiteshield_gold": 2598,
        "adamant_platebody_trim": 2599,
        "cert_adamant_platebody_trim": 2600,
        "adamant_platelegs_trim": 2601,
        "cert_adamant_platelegs_trim": 2602,
        "adamant_kiteshield_trim": 2603,
        "cert_adamant_kiteshield_trim": 2604,
        "adamant_full_helm_trim": 2605,
        "cert_adamant_full_helm_trim": 2606,
        "adamant_platebody_gold": 2607,
        "cert_adamant_platebody_gold": 2608,
        "adamant_platelegs_gold": 2609,
        "cert_adamant_platelegs_gold": 2610,
        "adamant_kiteshield_gold": 2611,
        "cert_adamant_kiteshield_gold": 2612,
        "adamant_full_helm_gold": 2613,
        "cert_adamant_full_helm_gold": 2614,
        "rune_platebody_gold": 2615,
        "cert_rune_platebody_gold": 2616,
        "rune_platelegs_gold": 2617,
        "cert_rune_platelegs_gold": 2618,
        "rune_full_helm_gold": 2619,
        "cert_rune_full_helm_gold": 2620,
        "rune_kiteshield_gold": 2621,
        "cert_rune_kiteshield_gold": 2622,
        "rune_platebody_trim": 2623,
        "cert_rune_platebody_trim": 2624,
        "rune_platelegs_trim": 2625,
        "cert_rune_platelegs_trim": 2626,
        "rune_full_helm_trim": 2627,
        "cert_rune_full_helm_trim": 2628,
        "rune_kiteshield_trim": 2629,
        "cert_rune_kiteshield_trim": 2630,
        "highwaymanmask": 2631,
        "cert_highwaymanmask": 2632,
        "berret_blue": 2633,
        "cert_berret_blue": 2634,
        "berret_black": 2635,
        "cert_berret_black": 2636,
        "berret_white": 2637,
        "cert_berret_white": 2638,
        "cavalier_brown": 2639,
        "cert_cavalier_brown": 2640,
        "cavalier_dark": 2641,
        "cert_cavalier_dark": 2642,
        "cavalier_black": 2643,
        "cert_cavalier_black": 2644,
        "headband_red": 2645,
        "cert_headband_red": 2646,
        "headband_black": 2647,
        "cert_headband_black": 2648,
        "headband_brown": 2649,
        "cert_headband_brown": 2650,
        "piratehat": 2651,
        "cert_piratehat": 2652,
        "rune_platebody_zamorak": 2653,
        "cert_rune_platebody_zamorak": 2654,
        "rune_platelegs_zamorak": 2655,
        "cert_rune_platelegs_zamorak": 2656,
        "rune_full_helm_zamorak": 2657,
        "cert_rune_full_helm_zamorak": 2658,
        "rune_kiteshield_zamorak": 2659,
        "cert_rune_kiteshield_zamorak": 2660,
        "rune_platebody_saradomin": 2661,
        "cert_rune_platebody_saradomin": 2662,
        "rune_platelegs_saradomin": 2663,
        "cert_rune_platelegs_saradomin": 2664,
        "rune_full_helm_saradomin": 2665,
        "cert_rune_full_helm_saradomin": 2666,
        "rune_kiteshield_saradomin": 2667,
        "cert_rune_kiteshield_saradomin": 2668,
        "rune_platebody_guthix": 2669,
        "cert_rune_platebody_guthix": 2670,
        "rune_platelegs_guthix": 2671,
        "cert_rune_platelegs_guthix": 2672,
        "rune_full_helm_guthix": 2673,
        "cert_rune_full_helm_guthix": 2674,
        "rune_kiteshield_guthix": 2675,
        "cert_rune_kiteshield_guthix": 2676,
        "trail_clue_easy_simple001": 2677,
        "trail_clue_easy_simple002": 2678,
        "trail_clue_easy_simple003": 2679,
        "trail_clue_easy_simple004": 2680,
        "trail_clue_easy_simple005": 2681,
        "trail_clue_easy_simple006": 2682,
        "trail_clue_easy_simple007": 2683,
        "trail_clue_easy_simple008": 2684,
        "trail_clue_easy_simple009": 2685,
        "trail_clue_easy_simple010": 2686,
        "trail_clue_easy_simple011": 2687,
        "trail_clue_easy_simple012": 2688,
        "trail_clue_easy_simple013": 2689,
        "trail_clue_easy_simple014": 2690,
        "trail_clue_easy_simple015": 2691,
        "trail_clue_easy_simple016": 2692,
        "trail_clue_easy_simple017": 2693,
        "trail_clue_easy_simple018": 2694,
        "trail_clue_easy_simple019": 2695,
        "trail_clue_easy_simple020": 2696,
        "trail_clue_easy_simple021": 2697,
        "trail_clue_easy_simple022": 2698,
        "trail_clue_easy_simple023": 2699,
        "trail_clue_easy_simple024": 2700,
        "trail_clue_easy_simple025": 2701,
        "trail_clue_easy_simple026": 2702,
        "trail_clue_easy_simple027": 2703,
        "trail_clue_easy_simple028": 2704,
        "trail_clue_easy_simple029": 2705,
        "trail_clue_easy_simple030": 2706,
        "trail_clue_easy_simple031": 2707,
        "trail_clue_easy_vague001": 2708,
        "trail_clue_easy_vague002": 2709,
        "trail_clue_easy_vague003": 2710,
        "trail_clue_easy_vague004": 2711,
        "trail_clue_easy_vague005": 2712,
        "trail_clue_easy_map001": 2713,
        "trail_clue_easy_map001_casket": 2714,
        "obj_2715": 2715,
        "trail_clue_easy_map002": 2716,
        "trail_clue_easy_map002_casket": 2717,
        "obj_2718": 2718,
        "trail_clue_easy_map003": 2719,
        "trail_clue_easy_map003_casket": 2720,
        "obj_2721": 2721,
        "trail_clue_hard_map001": 2722,
        "trail_clue_hard_sextant001": 2723,
        "trail_clue_hard_sextant001_casket": 2724,
        "trail_clue_hard_sextant002": 2725,
        "trail_clue_hard_sextant002_casket": 2726,
        "trail_clue_hard_sextant003": 2727,
        "trail_clue_hard_sextant003_casket": 2728,
        "trail_clue_hard_sextant004": 2729,
        "trail_clue_hard_sextant004_casket": 2730,
        "trail_clue_hard_sextant005": 2731,
        "trail_clue_hard_sextant005_casket": 2732,
        "trail_clue_hard_sextant006": 2733,
        "trail_clue_hard_sextant006_casket": 2734,
        "trail_clue_hard_sextant007": 2735,
        "trail_clue_hard_sextant007_casket": 2736,
        "trail_clue_hard_sextant008": 2737,
        "trail_clue_hard_sextant008_casket": 2738,
        "trail_clue_hard_sextant009": 2739,
        "trail_clue_hard_sextant009_casket": 2740,
        "trail_clue_hard_sextant010": 2741,
        "trail_clue_hard_sextant010_casket": 2742,
        "trail_clue_hard_sextant011": 2743,
        "trail_clue_hard_sextant011_casket": 2744,
        "trail_clue_hard_sextant012": 2745,
        "trail_clue_hard_sextant012_casket": 2746,
        "trail_clue_hard_sextant013": 2747,
        "trail_clue_hard_sextant013_casket": 2748,
        "trail_slidingpuzzleb01": 2749,
        "trail_slidingpuzzleb02": 2750,
        "trail_slidingpuzzleb03": 2751,
        "trail_slidingpuzzleb04": 2752,
        "trail_slidingpuzzleb05": 2753,
        "trail_slidingpuzzleb06": 2754,
        "trail_slidingpuzzleb07": 2755,
        "trail_slidingpuzzleb08": 2756,
        "trail_slidingpuzzleb09": 2757,
        "trail_slidingpuzzleb10": 2758,
        "trail_slidingpuzzleb11": 2759,
        "trail_slidingpuzzleb12": 2760,
        "trail_slidingpuzzleb13": 2761,
        "trail_slidingpuzzleb14": 2762,
        "trail_slidingpuzzleb15": 2763,
        "trail_slidingpuzzleb16": 2764,
        "trail_slidingpuzzleb17": 2765,
        "trail_slidingpuzzleb18": 2766,
        "trail_slidingpuzzleb19": 2767,
        "trail_slidingpuzzleb20": 2768,
        "trail_slidingpuzzleb21": 2769,
        "trail_slidingpuzzleb22": 2770,
        "trail_slidingpuzzleb23": 2771,
        "trail_slidingpuzzleb24": 2772,
        "trail_clue_hard_riddle001": 2773,
        "trail_clue_hard_riddle002": 2774,
        "trail_clue_hard_riddle002_casket": 2775,
        "trail_clue_hard_riddle003": 2776,
        "trail_clue_hard_riddle003_casket": 2777,
        "trail_clue_hard_riddle004": 2778,
        "trail_clue_hard_riddle004_casket": 2779,
        "trail_clue_hard_riddle005": 2780,
        "trail_clue_hard_riddle005_casket": 2781,
        "trail_clue_hard_riddle006": 2782,
        "trail_clue_hard_riddle007": 2783,
        "trail_clue_hard_riddle007_casket": 2784,
        "trail_clue_hard_riddle008": 2785,
        "trail_clue_hard_riddle009": 2786,
        "trail_clue_hard_riddle009_casket": 2787,
        "trail_clue_hard_riddle010": 2788,
        "trail_clue_hard_riddle010_casket": 2789,
        "trail_clue_hard_riddle011": 2790,
        "trail_clue_hard_riddle011_casket": 2791,
        "trail_clue_hard_riddle012": 2792,
        "trail_clue_hard_riddle013": 2793,
        "trail_clue_hard_riddle014": 2794,
        "trail_clue_hard_riddle014_puzzlebox": 2795,
        "trail_clue_hard_riddle015": 2796,
        "trail_clue_hard_riddle016": 2797,
        "trail_clue_hard_riddle016_puzzlebox": 2798,
        "trail_clue_hard_riddle017": 2799,
        "trail_clue_hard_riddle017_puzzlebox": 2800,
        "trail_clue_medium_sextant001": 2801,
        "trail_clue_medium_sextant001_casket": 2802,
        "trail_clue_medium_sextant002": 2803,
        "trail_clue_medium_sextant002_casket": 2804,
        "trail_clue_medium_sextant003": 2805,
        "trail_clue_medium_sextant003_casket": 2806,
        "trail_clue_medium_sextant004": 2807,
        "trail_clue_medium_sextant004_casket": 2808,
        "trail_clue_medium_sextant005": 2809,
        "trail_clue_medium_sextant005_casket": 2810,
        "trail_clue_medium_sextant006": 2811,
        "trail_clue_medium_sextant006_casket": 2812,
        "trail_clue_medium_sextant007": 2813,
        "trail_clue_medium_sextant007_casket": 2814,
        "trail_clue_medium_sextant008": 2815,
        "trail_clue_medium_sextant008_casket": 2816,
        "trail_clue_medium_sextant009": 2817,
        "trail_clue_medium_sextant009_casket": 2818,
        "trail_clue_medium_sextant010": 2819,
        "trail_clue_medium_sextant010_casket": 2820,
        "trail_clue_medium_sextant011": 2821,
        "trail_clue_medium_sextant011_casket": 2822,
        "trail_clue_medium_sextant012": 2823,
        "trail_clue_medium_sextant012_casket": 2824,
        "trail_clue_medium_sextant013": 2825,
        "trail_clue_medium_sextant013_casket": 2826,
        "trail_clue_medium_map001": 2827,
        "trail_clue_medium_map001_casket": 2828,
        "trail_clue_medium_map002": 2829,
        "trail_clue_medium_map002_casket": 2830,
        "trail_clue_medium_riddle001": 2831,
        "trail_clue_medium_riddle001_key": 2832,
        "trail_clue_medium_riddle002": 2833,
        "trail_clue_medium_riddle002_key": 2834,
        "trail_clue_medium_riddle003": 2835,
        "trail_clue_medium_riddle003_key": 2836,
        "trail_clue_medium_riddle004": 2837,
        "trail_clue_medium_riddle004_key": 2838,
        "trail_clue_medium_riddle005": 2839,
        "trail_clue_medium_riddle005_key": 2840,
        "trail_clue_medium_anagram001": 2841,
        "trail_clue_medium_anagram001_challenge": 2842,
        "trail_clue_medium_anagram002": 2843,
        "trail_clue_medium_anagram002_challenge": 2844,
        "trail_clue_medium_anagram003": 2845,
        "trail_clue_medium_anagram003_challenge": 2846,
        "trail_clue_medium_anagram004": 2847,
        "trail_clue_medium_anagram005": 2848,
        "trail_clue_medium_anagram006": 2849,
        "trail_clue_medium_anagram006_challenge": 2850,
        "trail_clue_medium_anagram007": 2851,
        "trail_clue_medium_anagram007_challenge": 2852,
        "trail_clue_medium_anagram008": 2853,
        "trail_clue_medium_anagram008_challenge": 2854,
        "trail_clue_medium_anagram009": 2855,
        "trail_clue_medium_anagram010": 2856,
        "trail_clue_medium_anagram011": 2857,
        "trail_clue_medium_anagram012": 2858,
        "wolf_bones": 2859,
        "cert_wolf_bones": 2860,
        "wolfbone_arrowheads": 2861,
        "achey_tree_logs": 2862,
        "cert_achey_tree_logs": 2863,
        "ogre_arrow_shaft": 2864,
        "ogre_headless_arrow": 2865,
        "ogre_arrow": 2866,
        "ogre_arrow_5": 2867,
        "ogre_arrow_4": 2868,
        "ogre_arrow_3": 2869,
        "ogre_arrow_2": 2870,
        "empty_ogre_bellows": 2871,
        "filled_ogre_bellow3": 2872,
        "filled_ogre_bellow2": 2873,
        "filled_ogre_bellow1": 2874,
        "bloated_toad": 2875,
        "raw_chompy": 2876,
        "cert_raw_chompy": 2877,
        "cooked_chompy": 2878,
        "cert_cooked_chompy": 2879,
        "ruined_chompy": 2880,
        "cert_ruined_chompy": 2881,
        "cooked_s_chompy": 2882,
        "ogre_bow": 2883,
        "chompy_bird_obj": 2884,
        "cert_chompy_bird_obj": 2885,
        "elemental_workshop_shield_book": 2886,
        "elemental_workshop_key": 2887,
        "elemental_workshop_lava_bowl": 2888,
        "elemental_workshop_lava_bowl_full": 2889,
        "elemental_shield": 2890,
        "cert_elemental_shield": 2891,
        "elemental_workshop_ore": 2892,
        "elemental_workshop_bar": 2893,
        "wolfenboots_grey": 2894,
        "cert_wolfenboots_grey": 2895,
        "wolfenrobetop_grey": 2896,
        "cert_wolfenrobetop_grey": 2897,
        "wolfenrobebottom_grey": 2898,
        "cert_wolfenrobebottom_grey": 2899,
        "wolfenhat_grey": 2900,
        "cert_wolfenhat_grey": 2901,
        "wolfengloves_grey": 2902,
        "cert_wolfengloves_grey": 2903,
        "wolfenboots_crimson": 2904,
        "cert_wolfenboots_crimson": 2905,
        "wolfenrobetop_crimson": 2906,
        "cert_wolfenrobetop_crimson": 2907,
        "wolfenrobebottom_crimson": 2908,
        "cert_wolfenrobebottom_crimson": 2909,
        "wolfenhat_crimson": 2910,
        "cert_wolfenhat_crimson": 2911,
        "wolfengloves_crimson": 2912,
        "cert_wolfengloves_crimson": 2913,
        "wolfenboots_tangerine": 2914,
        "cert_wolfenboots_tangerine": 2915,
        "wolfenrobetop_tangerine": 2916,
        "cert_wolfenrobetop_tangerine": 2917,
        "wolfenrobebottom_tangerine": 2918,
        "cert_wolfenrobebottom_tangerine": 2919,
        "wolfenhat_tangerine": 2920,
        "cert_wolfenhat_tangerine": 2921,
        "wolfengloves_tangerine": 2922,
        "cert_wolfengloves_tangerine": 2923,
        "wolfenboots_ocean": 2924,
        "cert_wolfenboots_ocean": 2925,
        "wolfenrobetop_ocean": 2926,
        "cert_wolfenrobetop_ocean": 2927,
        "wolfenrobebottom_ocean": 2928,
        "cert_wolfenrobebottom_ocean": 2929,
        "wolfenhat_ocean": 2930,
        "cert_wolfenhat_ocean": 2931,
        "wolfengloves_ocean": 2932,
        "cert_wolfengloves_ocean": 2933,
        "wolfenboots_purple": 2934,
        "cert_wolfenboots_purple": 2935,
        "wolfenrobetop_purple": 2936,
        "cert_wolfenrobetop_purple": 2937,
        "wolfenrobebottom_purple": 2938,
        "cert_wolfenrobebottom_purple": 2939,
        "wolfenhat_purple": 2940,
        "cert_wolfenhat_purple": 2941,
        "wolfengloves_purple": 2942,
        "cert_wolfengloves_purple": 2943,
        "pipkey_gold": 2944,
        "pipkey_iron": 2945,
        "piptinderbox_gold": 2946,
        "pipcandle_gold": 2947,
        "pippot_gold": 2948,
        "piphammer_gold": 2949,
        "pipfeather_gold": 2950,
        "pipneedle_gold": 2951,
        "dagger_wolfbane": 2952,
        "bucket_murkywater": 2953,
        "bucket_blessedwater": 2954,
        "moonlight_mead": 2955,
        "cert_moonlight_mead": 2956,
        "druid_pouch_empty": 2957,
        "druid_pouch": 2958,
        "rotten_food": 2959,
        "cert_rotten_food": 2960,
        "silver_sickle": 2961,
        "cert_silver_sickle": 2962,
        "silver_sickle_blessed": 2963,
        "bowl_empty_filliman": 2964,
        "cert_bowl_empty_filliman": 2965,
        "mirror": 2966,
        "filliman_journal": 2967,
        "bloom_spell": 2968,
        "used_bloom_spell": 2969,
        "mortmyremushroom": 2970,
        "cert_mortmyremushroom": 2971,
        "mortmyrebuddingstem": 2972,
        "cert_mortmyrebuddingstem": 2973,
        "mortmyrepear": 2974,
        "cert_mortmyrepear": 2975,
        "sickle_mould": 2976,
        "cert_sickle_mould": 2977,
        "cbhat1": 2978,
        "cbhat2": 2979,
        "cbhat3": 2980,
        "cbhat4": 2981,
        "cbhat5": 2982,
        "cbhat6": 2983,
        "cbhat7": 2984,
        "cbhat8": 2985,
        "cbhat9": 2986,
        "cbhat10": 2987,
        "cbhat11": 2988,
        "cbhat12": 2989,
        "cbhat13": 2990,
        "cbhat14": 2991,
        "cbhat15": 2992,
        "cbhat16": 2993,
        "cbhat17": 2994,
        "cbhat18": 2995,
        "agilityarena_ticket": 2996,
        "piratehook": 2997,
        "toadflax": 2998,
        "cert_toadflax": 2999,
        "snapdragon": 3000,
        "cert_snapdragon": 3001,
        "toadflaxvial": 3002,
        "cert_toadflaxvial": 3003,
        "snapdragonvial": 3004,
        "cert_snapdragonvial": 3005,
        "firework": 3006,
        "cert_firework": 3007,
        "4dose1energy": 3008,
        "cert_4dose1energy": 3009,
        "3dose1energy": 3010,
        "cert_3dose1energy": 3011,
        "2dose1energy": 3012,
        "cert_2dose1energy": 3013,
        "1dose1energy": 3014,
        "cert_1dose1energy": 3015,
        "4dose2energy": 3016,
        "cert_4dose2energy": 3017,
        "3dose2energy": 3018,
        "cert_3dose2energy": 3019,
        "2dose2energy": 3020,
        "cert_2dose2energy": 3021,
        "1dose2energy": 3022,
        "cert_1dose2energy": 3023,
        "4dose2restore": 3024,
        "cert_4dose2restore": 3025,
        "3dose2restore": 3026,
        "cert_3dose2restore": 3027,
        "2dose2restore": 3028,
        "cert_2dose2restore": 3029,
        "1dose2restore": 3030,
        "cert_1dose2restore": 3031,
        "4dose1agility": 3032,
        "cert_4dose1agility": 3033,
        "3dose1agility": 3034,
        "cert_3dose1agility": 3035,
        "2dose1agility": 3036,
        "cert_2dose1agility": 3037,
        "1dose1agility": 3038,
        "cert_1dose1agility": 3039,
        "4dose1magic": 3040,
        "cert_4dose1magic": 3041,
        "3dose1magic": 3042,
        "cert_3dose1magic": 3043,
        "2dose1magic": 3044,
        "cert_2dose1magic": 3045,
        "1dose1magic": 3046,
        "cert_1dose1magic": 3047,
        "cert_piratehook": 3048,
        "unidentified_toadflax": 3049,
        "cert_unidentified_toadflax": 3050,
        "unidentified_snapdragon": 3051,
        "cert_unidentified_snapdragon": 3052,
        "lava_battlestaff": 3053,
        "mystic_lava_staff": 3054,
        "cert_lava_battlestaff": 3055,
        "cert_mystic_lava_staff": 3056,
        "macro_mime_mask": 3057,
        "macro_mime_top": 3058,
        "macro_mime_legs": 3059,
        "macro_mime_gloves": 3060,
        "macro_mime_boots": 3061,
        "macro_cube": 3062,
        "macro_cube_redtriangle": 3063,
        "cert_macro_cube_redtriangle": 3064,
        "macro_cube_bluetriangle": 3065,
        "cert_macro_cube_bluetriangle": 3066,
        "macro_cube_yellowtriangle": 3067,
        "cert_macro_cube_yellowtriangle": 3068,
        "macro_cube_redsquare": 3069,
        "cert_macro_cube_redsquare": 3070,
        "macro_cube_bluesquare": 3071,
        "cert_macro_cube_bluesquare": 3072,
        "macro_cube_yellowsquare": 3073,
        "cert_macro_cube_yellowsquare": 3074,
        "macro_cube_redcircle": 3075,
        "cert_macro_cube_redcircle": 3076,
        "macro_cube_bluecircle": 3077,
        "cert_macro_cube_bluecircle": 3078,
        "macro_cube_yellowcircle": 3079,
        "cert_macro_cube_yellowcircle": 3080,
        "macro_cube_redstar": 3081,
        "cert_macro_cube_redstar": 3082,
        "macro_cube_bluestar": 3083,
        "cert_macro_cube_bluestar": 3084,
        "macro_cube_yellowstar": 3085,
        "cert_macro_cube_yellowstar": 3086,
        "macro_cube_redhalfmoon": 3087,
        "cert_macro_cube_redhalfmoon": 3088,
        "macro_cube_bluehalfmoon": 3089,
        "cert_macro_cube_bluehalfmoon": 3090,
        "macro_cube_yellowhalfmoon": 3091,
        "cert_macro_cube_yellowhalfmoon": 3092,
        "black_dart": 3093,
        "black_dart_p": 3094,
        "bronze_claws": 3095,
        "iron_claws": 3096,
        "steel_claws": 3097,
        "black_claws": 3098,
        "mithril_claws": 3099,
        "adamant_claws": 3100,
        "rune_claws": 3101,
        "death_combination": 3102,
        "death_iou": 3103,
        "death_secretwaymap": 3104,
        "death_climbingboots": 3105,
        "cert_death_climbingboots": 3106,
        "death_spikedboots": 3107,
        "cert_death_spikedboots": 3108,
        "death_cannonball_red": 3109,
        "death_cannonball_blue": 3110,
        "death_cannonball_yellow": 3111,
        "death_cannonball_purple": 3112,
        "death_cannonball_green": 3113,
        "death_entrancecert": 3114,
        "cert_bronze_claws": 3115,
        "cert_iron_claws": 3116,
        "cert_steel_claws": 3117,
        "cert_black_claws": 3118,
        "cert_mithril_claws": 3119,
        "cert_adamant_claws": 3120,
        "cert_rune_claws": 3121,
        "granite_shield": 3122,
        "tbwt_beast_bones": 3123,
        "cert_tbwt_beast_bones": 3124,
        "tbwt_jogre_bones": 3125,
        "cert_tbwt_jogre_bones": 3126,
        "tbwt_burnt_jogre_bones": 3127,
        "tbwt_burnt_jogre_bones_in_raw_karambwanji_paste": 3128,
        "tbwt_burnt_jogre_bones_in_cooked_karambwanji_paste": 3129,
        "tbwt_burnt_jogre_bones_marinated_in_karambwanji": 3130,
        "tbwt_jogre_bones_in_raw_karambwanji_paste": 3131,
        "tbwt_jogre_bones_in_cooked_karambwanji_paste": 3132,
        "tbwt_jogre_bones_marinated_in_karambwanji": 3133,
        "cert_granite_shield": 3134,
        "troll_key_prison": 3135,
        "troll_key_godric": 3136,
        "troll_key_eadgar": 3137,
        "cactus_potato": 3138,
        "cert_cactus_potato": 3139,
        "dragon_chainbody": 3140,
        "cert_dragon_chainbody": 3141,
        };

    private uidHerbIds = [199,201,203,205,207,209,211,213,215,2485,217];
    private rareTableIds = [
        // jewel
        1623,1621,1619,1617,830,985,987,1452,1462,
        // rare
        561,829,560,563,892,886,1319,1373,1185,1149,1201,
        995,996,997,998,999,1000,1001,1002,1003,1004,
        2363, 1615, 443,
        // megarare
        1247, 2366, 1249];
    private hardClueIds = [2722, 2723, 2724, 2725, 2726, 2727, 2728, 2729, 2730,
        2731, 2732, 2733, 2734, 2735, 2736, 2737, 2738, 2739, 2740, 2741, 2742,
        2743, 2744, 2745, 2746, 2747, 2748, 2773, 2774, 2775, 2776, 2777, 2778,
        2779, 2780, 2781, 2782, 2783, 2784, 2785, 2786, 2787, 2788, 2789, 2790,
        2791, 2792, 2793, 2794, 2795, 2796, 2797, 2798, 2799, 2800];
    
    private rangedAmmoIds = [
        this.itemIds['bronze_arrow'],
        this.itemIds['iron_arrow'],
        this.itemIds['steel_arrow'],
        this.itemIds['mithril_arrow'],
        this.itemIds['adamant_arrow'],
        this.itemIds['rune_arrow'],
        this.itemIds['bronze_knife'],
        this.itemIds['black_knife'],
        this.itemIds['iron_knife'],
        this.itemIds['steel_knife'],
        this.itemIds['mithril_knife'],
        this.itemIds['adamant_knife'],
        this.itemIds['rune_knife'],
        this.itemIds['bronze_dart'],
        this.itemIds['iron_dart'],
        this.itemIds['steel_dart'],
        this.itemIds['mithril_dart'],
        this.itemIds['adamant_dart'],
        this.itemIds['rune_dart'],
    ]

    private magicRunesIds = [
        this.itemIds['firerune'],
        this.itemIds['waterrune'],
        this.itemIds['airrune'],
        this.itemIds['earthrune'],
        this.itemIds['mindrune'],
        this.itemIds['bodyrune'],
        this.itemIds['deathrune'],
        this.itemIds['naturerune'],
        this.itemIds['chaosrune'],
        this.itemIds['lawrune'],
        this.itemIds['cosmicrune'],
        this.itemIds['bloodrune'],
        this.itemIds['soulrune'],
    ]

    // ----

    constructor(nodeid: number, lowmem: boolean, members: boolean) {
        super();

        window.addEventListener('keydown', async (event) => {
            if (event.key === 'F1') {
                this.f1Functions[this.f1FunctionIndex].fn(this);
            } else if (event.key === 'F2') {
                this.stopLoop = true;
            } else if (event.key === 'F3') {
                // Cycle to next f1Function and add message explaining it.
                this.f1FunctionIndex = (this.f1FunctionIndex + 1) % this.f1Functions.length;
                this.addChat(0, `(Press F1) ${this.f1FunctionIndex}: ${this.f1Functions[this.f1FunctionIndex].description}`, '');
            } else if (event.key === 'F6') {

                let globalX = (this.localPlayer?.routeX[0] ?? 0) + this.mapBuildBaseX;
                let globalZ = (this.localPlayer?.routeZ[0] ?? 0) + this.mapBuildBaseZ;
                this.logArray.push([globalX, globalZ]);
                console.log(JSON.stringify(this.logArray));
            } else if (event.key === 'F7') {
                this.blinkIfNPCLowHP('King black dragon', 20);
            }
        });

        if (typeof nodeid === 'undefined' || typeof lowmem === 'undefined' || typeof members === 'undefined') {
            return;
        }

        console.log(`RS2 user client - release #${Constants.CLIENT_VERSION}`);

        Client.nodeId = nodeid;
        Client.membersWorld = members;

        if (lowmem) {
            Client.setLowMem();
        } else {
            Client.setHighMem();
        }

        this.run();
    }

    static setLowMem(): void {
        World.lowMem = true;
        Pix3D.lowMem = true;
        Client.lowMem = true;
        ClientBuild.lowMem = true;
    }

    static setHighMem(): void {
        World.lowMem = false;
        Pix3D.lowMem = false;
        Client.lowMem = false;
        ClientBuild.lowMem = false;
    }

    saveMidi(fading: boolean, data: Uint8Array) {
        playMidi(data, this.midiVolume, fading);
    }

    // ----

    override async maininit() {
        if (this.isMobile && Client.lowMem) {
            // force mobile on low detail mode to 30 fps
            this.setTargetedFramerate(30);
        }

        if (this.alreadyStarted) {
            this.errorStarted = true;
            return;
        }

        this.alreadyStarted = true;

        if (typeof process.env.SECURE_ORIGIN !== 'undefined' && process.env.SECURE_ORIGIN !== 'false' && window.location.hostname !== process.env.SECURE_ORIGIN) {
            this.errorHost = true;
        }

        try {
            this.db = new Database(await Database.openDatabase());
        } catch (_e) {
            // possibly incognito mode
            this.db = null;
        }

        try {
            await this.drawProgress(10, 'Connecting to web server');

            const checksums: Packet = new Packet(await downloadUrl('/crc'));
            for (let i: number = 0; i < 9; i++) {
                this.jagChecksum[i] = checksums.g4();
            }

            this.jagTitle = await this.getJagFile('title', 'title screen', 1, 25);
            this.fontPlain11 = PixFont.fromArchive(this.jagTitle, 'p11');
            this.fontPlain12 = PixFont.fromArchive(this.jagTitle, 'p12');
            this.fontBold12 = PixFont.fromArchive(this.jagTitle, 'b12');
            this.fontQuill8 = PixFont.fromArchive(this.jagTitle, 'q8');

            await this.loadTitleBackground();
            this.loadTitleImages();

            const jagConfig: Jagfile = await this.getJagFile('config', 'config', 2, 30);
            const jagInterface: Jagfile = await this.getJagFile('interface', 'interface', 3, 35);
            const jagMedia: Jagfile = await this.getJagFile('media', '2d graphics', 4, 40);
            const jagTextures: Jagfile = await this.getJagFile('textures', 'textures', 6, 45);
            const jagWordenc: Jagfile = await this.getJagFile('wordenc', 'chat system', 7, 50);
            const jagSounds: Jagfile = await this.getJagFile('sounds', 'sound effects', 8, 55);

            this.mapl = new Uint8Array3d(CollisionConstants.LEVELS, CollisionConstants.SIZE, CollisionConstants.SIZE);
            this.groundh = new Int32Array3d(CollisionConstants.LEVELS, CollisionConstants.SIZE + 1, CollisionConstants.SIZE + 1);
            this.world = new World(this.groundh, CollisionConstants.SIZE, CollisionConstants.LEVELS, CollisionConstants.SIZE);
            for (let level: number = 0; level < CollisionConstants.LEVELS; level++) {
                this.levelCollisionMap[level] = new CollisionMap();
            }
            this.minimap = new Pix32(512, 512);

            const versionlist: Jagfile = await this.getJagFile('versionlist', 'update list', 5, 60);

            await this.drawProgress(60, 'Connecting to update server');

            this.onDemand = new OnDemand(versionlist, this);
            AnimFrame.init(this.onDemand.getAnimFrameCount());
            Model.init(this.onDemand.getFileCount(0), this.onDemand);

            await this.drawProgress(62, 'Preloading cache');
            await this.onDemand.prefetchAll();

            if (!Client.lowMem) {
                this.midiSong = 0; // scape_main
                this.midiFading = false;
                this.onDemand.request(2, this.midiSong);

                while (this.onDemand.remaining() > 0) {
                    await this.onDemandLoop();
                    await sleep(100);
                }
            }

            await this.drawProgress(65, 'Requesting animations');

            const animCount = this.onDemand.getFileCount(1);
            for (let i = 0; i < animCount; i++) {
                this.onDemand.request(1, i);
            }

            while (this.onDemand.remaining() > 0) {
                const progress = animCount - this.onDemand.remaining();
                if (progress > 0) {
                    await this.drawProgress(65, 'Loading animations - ' + ((progress * 100 / animCount) | 0) + '%');
                }

                await this.onDemandLoop();
                await sleep(100);
            }

            await this.drawProgress(70, 'Requesting models');

            const modelCount = this.onDemand.getFileCount(0);
            for (let i = 0; i < modelCount; i++) {
                const flags = this.onDemand.getModelUse(i);
                if ((flags & 0x1) != 0) {
                    this.onDemand.request(0, i);
                }
            }

            const modelPrefetch = this.onDemand.remaining();
            while (this.onDemand.remaining() > 0) {
                const progress = modelPrefetch - this.onDemand.remaining();
                if (progress > 0) {
                    await this.drawProgress(70, 'Loading models - ' + ((progress * 100 / modelPrefetch) | 0) + '%');
                }

                await this.onDemandLoop();
                await sleep(100);
            }

            if (this.db) {
                await this.drawProgress(75, 'Requesting maps');

                this.onDemand.request(3, this.onDemand.getMapFile(47, 48, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(47, 48, 1));

                this.onDemand.request(3, this.onDemand.getMapFile(48, 48, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(48, 48, 1));

                this.onDemand.request(3, this.onDemand.getMapFile(49, 48, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(49, 48, 1));

                this.onDemand.request(3, this.onDemand.getMapFile(47, 47, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(47, 47, 1));

                this.onDemand.request(3, this.onDemand.getMapFile(48, 47, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(48, 47, 1));

                this.onDemand.request(3, this.onDemand.getMapFile(148, 48, 0));
                this.onDemand.request(3, this.onDemand.getMapFile(148, 48, 1));

                const mapPrefetch = this.onDemand.remaining();
                while (this.onDemand.remaining() > 0) {
                    const progress = mapPrefetch - this.onDemand.remaining();
                    if (progress > 0) {
                        await this.drawProgress(75, 'Loading maps - ' + ((progress * 100 / mapPrefetch) | 0) + '%');
                    }

                    await this.onDemandLoop();
                    await sleep(100);
                }
            }

            const modelCount2 = this.onDemand.getFileCount(0);
            for (let i = 0; i < modelCount2; i++) {
                const flags = this.onDemand.getModelUse(i);

                let priority = 0;
                if ((flags & 0x8) != 0) {
                    priority = 10;
                } else if ((flags & 0x20) != 0) {
                    priority = 9;
                } else if ((flags & 0x10) != 0) {
                    priority = 8;
                } else if ((flags & 0x40) != 0) {
                    priority = 7;
                } else if ((flags & 0x80) != 0) {
                    priority = 6;
                } else if ((flags & 0x2) != 0) {
                    priority = 5;
                } else if ((flags & 0x4) != 0) {
                    priority = 4;
                }

                if ((flags & 0x1) != 0) {
                    priority = 3;
                }

                if (priority != 0) {
                    this.onDemand.requestModel(i);
                    // await this.onDemand.prefetchPriority(0, i, priority);
                }
            }

            await this.onDemand.prefetchMaps(Client.membersWorld);

            if (!Client.lowMem) {
                const midiCount = this.onDemand.getFileCount(2);
                for (let i = 0; i < midiCount; i++) {
                    if (this.onDemand.isMidiJingle(i)) {
                        this.onDemand.prefetchPriority(2, i, 1);
                    }
                }
            }

            await this.drawProgress(80, 'Unpacking media');

            this.invback = Pix8.load(jagMedia, 'invback', 0);
            this.chatback = Pix8.load(jagMedia, 'chatback', 0);
            this.mapback = Pix8.load(jagMedia, 'mapback', 0);

            this.backbase1 = Pix8.load(jagMedia, 'backbase1', 0);
            this.backbase2 = Pix8.load(jagMedia, 'backbase2', 0);
            this.backhmid1 = Pix8.load(jagMedia, 'backhmid1', 0);

            for (let i: number = 0; i < 13; i++) {
                this.sideicons[i] = Pix8.load(jagMedia, 'sideicons', i);
            }

            this.compass = Pix32.load(jagMedia, 'compass', 0);

            this.mapedge = Pix32.load(jagMedia, 'mapedge', 0);
            this.mapedge.trim();

            try {
                for (let i: number = 0; i < 50; i++) {
                    this.mapscene[i] = Pix8.load(jagMedia, 'mapscene', i);
                }
            } catch (_e) {
                // empty
            }

            try {
                for (let i: number = 0; i < 50; i++) {
                    this.mapfunction[i] = Pix32.load(jagMedia, 'mapfunction', i);
                }
            } catch (_e) {
                // empty
            }

            try {
                for (let i: number = 0; i < 20; i++) {
                    this.hitmarks[i] = Pix32.load(jagMedia, 'hitmarks', i);
                }
            } catch (_e) {
                // empty
            }

            try {
                for (let i: number = 0; i < 20; i++) {
                    this.headicons[i] = Pix32.load(jagMedia, 'headicons', i);
                }
            } catch (_e) {
                // empty
            }

            this.mapmarker1 = Pix32.load(jagMedia, 'mapmarker', 0);
            this.mapmarker2 = Pix32.load(jagMedia, 'mapmarker', 1);

            for (let i: number = 0; i < 8; i++) {
                this.cross[i] = Pix32.load(jagMedia, 'cross', i);
            }

            this.mapdots1 = Pix32.load(jagMedia, 'mapdots', 0);
            this.mapdots2 = Pix32.load(jagMedia, 'mapdots', 1);
            this.mapdots3 = Pix32.load(jagMedia, 'mapdots', 2);
            this.mapdots4 = Pix32.load(jagMedia, 'mapdots', 3);

            this.scrollbar1 = Pix8.load(jagMedia, 'scrollbar', 0);
            this.scrollbar2 = Pix8.load(jagMedia, 'scrollbar', 1);

            this.redstone1 = Pix8.load(jagMedia, 'redstone1', 0);
            this.redstone2 = Pix8.load(jagMedia, 'redstone2', 0);
            this.redstone3 = Pix8.load(jagMedia, 'redstone3', 0);

            this.redstone1h = Pix8.load(jagMedia, 'redstone1', 0);
            this.redstone1h?.hflip();

            this.redstone2h = Pix8.load(jagMedia, 'redstone2', 0);
            this.redstone2h?.hflip();

            this.redstone1v = Pix8.load(jagMedia, 'redstone1', 0);
            this.redstone1v?.vflip();

            this.redstone2v = Pix8.load(jagMedia, 'redstone2', 0);
            this.redstone2v?.vflip();

            this.redstone3v = Pix8.load(jagMedia, 'redstone3', 0);
            this.redstone3v?.vflip();

            this.redstone1hv = Pix8.load(jagMedia, 'redstone1', 0);
            this.redstone1hv?.hflip();
            this.redstone1hv?.vflip();

            this.redstone2hv = Pix8.load(jagMedia, 'redstone2', 0);
            this.redstone2hv?.hflip();
            this.redstone2hv?.vflip();

            for (let i = 0; i < 2; i++) {
                this.modIcons[i] = Pix8.load(jagMedia, 'mod_icons', i);
            }

            const backleft1: Pix32 = Pix32.load(jagMedia, 'backleft1', 0);
            this.areaBackleft1 = new PixMap(backleft1.wi, backleft1.hi);
            backleft1.quickPlotSprite(0, 0);

            const backleft2: Pix32 = Pix32.load(jagMedia, 'backleft2', 0);
            this.areaBackleft2 = new PixMap(backleft2.wi, backleft2.hi);
            backleft2.quickPlotSprite(0, 0);

            const backright1: Pix32 = Pix32.load(jagMedia, 'backright1', 0);
            this.areaBackright1 = new PixMap(backright1.wi, backright1.hi);
            backright1.quickPlotSprite(0, 0);

            const backright2: Pix32 = Pix32.load(jagMedia, 'backright2', 0);
            this.areaBackright2 = new PixMap(backright2.wi, backright2.hi);
            backright2.quickPlotSprite(0, 0);

            const backtop1: Pix32 = Pix32.load(jagMedia, 'backtop1', 0);
            this.areaBacktop1 = new PixMap(backtop1.wi, backtop1.hi);
            backtop1.quickPlotSprite(0, 0);

            const backvmid1: Pix32 = Pix32.load(jagMedia, 'backvmid1', 0);
            this.areaBackvmid1 = new PixMap(backvmid1.wi, backvmid1.hi);
            backvmid1.quickPlotSprite(0, 0);

            const backvmid2: Pix32 = Pix32.load(jagMedia, 'backvmid2', 0);
            this.areaBackvmid2 = new PixMap(backvmid2.wi, backvmid2.hi);
            backvmid2.quickPlotSprite(0, 0);

            const backvmid3: Pix32 = Pix32.load(jagMedia, 'backvmid3', 0);
            this.areaBackvmid3 = new PixMap(backvmid3.wi, backvmid3.hi);
            backvmid3.quickPlotSprite(0, 0);

            const backhmid2: Pix32 = Pix32.load(jagMedia, 'backhmid2', 0);
            this.areaBackhmid2 = new PixMap(backhmid2.wi, backhmid2.hi);
            backhmid2.quickPlotSprite(0, 0);

            const randR: number = ((Math.random() * 21.0) | 0) - 10;
            const randG: number = ((Math.random() * 21.0) | 0) - 10;
            const randB: number = ((Math.random() * 21.0) | 0) - 10;
            const rand: number = ((Math.random() * 41.0) | 0) - 20;

            for (let i: number = 0; i < 50; i++) {
                if (this.mapfunction[i]) {
                    this.mapfunction[i]?.rgbAdjust(randR + rand, randG + rand, randB + rand);
                }

                if (this.mapscene[i]) {
                    this.mapscene[i]?.rgbAdjust(randR + rand, randG + rand, randB + rand);
                }
            }

            await this.drawProgress(83, 'Unpacking textures');

            Pix3D.unpackTextures(jagTextures);
            Pix3D.initColourTable(0.8);
            Pix3D.initPool(20);

            await this.drawProgress(86, 'Unpacking config');

            SeqType.unpack(jagConfig);
            LocType.unpack(jagConfig);
            FloType.unpack(jagConfig);
            ObjType.unpack(jagConfig, Client.membersWorld);
            NpcType.unpack(jagConfig);
            IdkType.unpack(jagConfig);
            SpotAnimType.unpack(jagConfig);
            VarpType.unpack(jagConfig);
            VarBitType.unpack(jagConfig);

            if (!Client.lowMem) {
                await this.drawProgress(90, 'Unpacking sounds');
                Wave.unpack(jagSounds);
            }

            await this.drawProgress(95, 'Unpacking interfaces');

            IfType.unpack(jagInterface, jagMedia, [this.fontPlain11, this.fontPlain12, this.fontBold12, this.fontQuill8]);

            await this.drawProgress(100, 'Preparing game engine');

            for (let y: number = 0; y < 33; y++) {
                let left: number = 999;
                let right: number = 0;

                for (let x: number = 0; x < 34; x++) {
                    if (this.mapback.data[x + y * this.mapback.wi] === 0) {
                        if (left === 999) {
                            left = x;
                        }
                    } else if (left !== 999) {
                        right = x;
                        break;
                    }
                }

                this.compassMaskLineOffsets[y] = left;
                this.compassMaskLineLengths[y] = right - left;
            }

            for (let y: number = 5; y < 156; y++) {
                let left: number = 999;
                let right: number = 0;

                for (let x: number = 25; x < 172; x++) {
                    if (this.mapback.data[x + y * this.mapback.wi] === 0 && (x > 34 || y > 34)) {
                        if (left === 999) {
                            left = x;
                        }
                    } else if (left !== 999) {
                        right = x;
                        break;
                    }
                }

                this.minimapMaskLineOffsets[y - 5] = left - 25;
                this.minimapMaskLineLengths[y - 5] = right - left;
            }

            Pix3D.initWH(479, 96);
            this.chatbackScanline = Pix3D.scanline;

            Pix3D.initWH(190, 261);
            this.sidebarScanline = Pix3D.scanline;

            Pix3D.initWH(512, 334);
            this.viewportScanline = Pix3D.scanline;

            const distance: Int32Array = new Int32Array(9);
            for (let x: number = 0; x < 9; x++) {
                const angle: number = x * 32 + 128 + 15;
                const offset: number = angle * 3 + 600;
                const sin: number = Pix3D.sinTable[angle];
                distance[x] = (offset * sin) >> 16;
            }

            World.init(512, 334, 500, 800, distance);
            WordFilter.unpack(jagWordenc);

            setInterval(() => {
                this.mouseTracking.cycle();
            }, 50);
        } catch (e) {
            console.error(e);

            if (e instanceof Error) {
                this.errorMessage = `loaderror - ${this.lastProgressMessage} ${this.lastProgressPercent}%: ${e.message}`;
            }

            this.errorLoading = true;
        }
    }

    override async mainloop() {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            return;
        }

        this.loopCycle++;

        if (this.ingame) {
            await this.gameLoop();
        } else {
            await this.titleScreenLoop();
        }

        await this.onDemandLoop();
    }

    override async maindraw() {
        if (this.errorStarted || this.errorLoading || this.errorHost) {
            this.drawError();
            return;
        }

        this.drawCycle++;

        if (this.ingame) {
            this.gameDraw();
        } else {
            await this.titleScreenDraw();
        }

        if (this.isMobile) {
            MobileKeyboard.draw();
        }

        this.dragCycles = 0;
    }

    override refresh() {
        this.redrawFrame = true;
    }

    // ----

    override async drawProgress(percent: number, message: string): Promise<void> {
        console.log(`${percent}%: ${message}`);

        this.lastProgressPercent = percent;
        this.lastProgressMessage = message;

        await this.loadTitle();

        if (!this.jagTitle) {
            await super.drawProgress(percent, message);
            return;
        }

        this.imageTitle4?.bind();

        const x: number = 360;
        const y: number = 200;

        const offsetY: number = 20;
        this.fontBold12?.centreString((x / 2) | 0, ((y / 2) | 0) - offsetY - 26, 'RuneScape is loading - please wait...', Colour.WHITE);

        const midY: number = ((y / 2) | 0) - 18 - offsetY;
        Pix2D.drawRect(((x / 2) | 0) - 152, midY, 304, 34, 0x8c1111);
        Pix2D.drawRect(((x / 2) | 0) - 151, midY + 1, 302, 32, Colour.BLACK);
        Pix2D.fillRect(((x / 2) | 0) - 150, midY + 2, percent * 3, 30, 0x8c1111);
        Pix2D.fillRect(((x / 2) | 0) - 150 + percent * 3, midY + 2, 300 - percent * 3, 30, Colour.BLACK);
        this.fontBold12?.centreString((x / 2) | 0, ((y / 2) | 0) + 5 - offsetY, message, Colour.WHITE);

        this.imageTitle4?.draw(202, 171);

        if (this.redrawFrame) {
            this.redrawFrame = false;

            if (!this.flameActive) {
                this.imageTitle0?.draw(0, 0);
                this.imageTitle1?.draw(637, 0);
            }

            this.imageTitle2?.draw(128, 0);
            this.imageTitle3?.draw(202, 371);
            this.imageTitle5?.draw(0, 265);
            this.imageTitle6?.draw(562, 265);
            this.imageTitle7?.draw(128, 171);
            this.imageTitle8?.draw(562, 171);
        }

        await sleep(5); // return a slice of time to the main loop so it can update the progress bar
    }

    private drawError(): void {
        canvas2d.fillStyle = 'black';
        canvas2d.fillRect(0, 0, this.sWid, this.sHei);

        this.setFramerate(1);

        this.flameActive = false;
        let y: number = 0;

        if (this.errorLoading) {
            canvas2d.font = 'bold 16px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';
            y = 35;
            canvas2d.fillText('Sorry, an error has occured whilst loading RuneScape', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try clearing your web-browsers cache', 30, y); // "2: Try clearing your web-browsers cache from tools->internet options"

            y += 30;
            canvas2d.fillText('3: Try using a different game-world', 30, y);

            y += 30;
            canvas2d.fillText('4: Try rebooting your computer', 30, y);

            y += 30;
            canvas2d.fillText('5: Try selecting a different method from the play-game menu', 30, y); // "5: Try selecting a different version of Java from the play-game menu"
        } else if (this.errorHost) {
            canvas2d.font = 'bold 20px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'white';

            y = 50;
            canvas2d.fillText('Error - unable to load game!', 50, y);

            y += 50;
            canvas2d.fillText('To play RuneScape make sure you play from', 50, y);

            y += 50;
            canvas2d.fillText('An approved domain', 50, y); // "http://www.runescape.com"
        } else if (this.errorStarted) {
            canvas2d.font = 'bold 13px helvetica, sans-serif';
            canvas2d.textAlign = 'left';
            canvas2d.fillStyle = 'yellow';

            y = 35;
            canvas2d.fillText('Error a copy of RuneScape already appears to be loaded', 30, y);

            y += 50;
            canvas2d.fillStyle = 'white';
            canvas2d.fillText('To fix this try the following (in order):', 30, y);

            y += 50;
            canvas2d.font = 'bold 12px helvetica, sans-serif';
            canvas2d.fillText('1: Try closing ALL open web-browser windows, and reloading', 30, y);

            y += 30;
            canvas2d.fillText('2: Try rebooting your computer, and reloading', 30, y);
        }

        if (this.errorMessage) {
            y += 50;
            canvas2d.fillStyle = 'red';
            canvas2d.fillText(this.errorMessage, 30, y);
        }
    }

    private async getJagFile(filename: string, displayName: string, index: number, progress: number): Promise<Jagfile> {
        const crc = this.jagChecksum[index];

        let data: Uint8Array | undefined;
        let retry: number = 5;

        try {
            if (this.db) {
                data = await this.db.read(0, index);
            }
        } catch (_e) {
            // empty
        }

        if (data && Packet.getcrc(data, 0, data.length) !== crc) {
            data = undefined;
        }

        if (data) {
            return new Jagfile(data);
        }

        let loops = 0;
        while (!data) {
            await this.drawProgress(progress, `Requesting ${displayName}`);

            try {
                data = await downloadUrl(`/${filename}${crc}`);

                const checksum = Packet.getcrc(data, 0, data.length);
                if (crc === checksum) {
                    try {
                        if (this.db) {
                            await this.db.write(0, index, data);
                        }
                    } catch (_e) {
                        // empty
                    }
                } else {
                    data = undefined;
                    loops++;
                }
            } catch (_e) {
                data = undefined;
            }

            if (!data) {
                for (let i: number = retry; i > 0; i--) {
                    if (loops >= 3) {
                        await this.drawProgress(progress, 'Game updated - please reload page');
                        i = 10;
                    } else {
                        await this.drawProgress(progress, `Error loading - Will retry in ${i} secs.`);
                    }

                    await sleep(1000);
                }

                retry *= 2;
                if (retry > 60) {
                    retry = 60;
                }
            }
        }

        return new Jagfile(data);
    }

    async onDemandLoop() {
        if (!this.onDemand) {
            return;
        }

        await this.onDemand.run();

        while (true) {
            const req = this.onDemand.loop();
            if (req === null) {
                return;
            }

            if (!req.data) {
                continue;
            }

            if (req.archive === 0) {
                Model.unpack(req.file, req.data);

                if ((this.onDemand.getModelUse(req.file) & 0x62) != 0) {
                    this.redrawSidebar = true;

                    if (this.chatLayerId !== -1) {
                        this.redrawChatback = true;
                    }
                }
            } else if (req.archive === 1) {
                AnimFrame.unpack(req.data);
            } else if (req.archive === 2) {
                if (this.midiSong === req.file) {
                    this.saveMidi(this.midiFading, req.data);
                }
            } else if (req.archive === 3) {
                if (this.mapBuildGroundData && this.mapBuildLocationData && this.sceneState === 1) {
                    for (let i = 0; i < this.mapBuildGroundData.length; i++) {
                        if (this.mapBuildGroundFile[i] == req.file) {
                            this.mapBuildGroundData[i] = req.data;

                            if (req.data == null) {
                                this.mapBuildGroundFile[i] = -1;
                            }

                            break;
                        }

                        if (this.mapBuildLocationFile[i] == req.file) {
                            this.mapBuildLocationData[i] = req.data;

                            if (req.data == null) {
                                this.mapBuildLocationFile[i] = -1;
                            }

                            break;
                        }
                    }
                }
            } else if (req.archive === 93) {
                if (this.onDemand.hasMapLocFile(req.file)) {
                    ClientBuild.prefetchLocations(new Packet(req.data), this.onDemand);
                }
            }
        }
    }

    // jag::oldscape::TitleScreen::Loop
    private async titleScreenLoop(): Promise<void> {
        if (this.loginscreen === 0) {
            let x: number = ((this.sWid / 2) | 0) - 80;
            let y: number = ((this.sHei / 2) | 0) + 20;

            y += 20;
            if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.loginscreen = 3;
                this.loginSelect = 0;
            }

            x = ((this.sWid / 2) | 0) + 80;
            if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.loginMes1 = '';
                this.loginMes2 = 'Enter your username & password.';
                this.loginscreen = 2;
                this.loginSelect = 0;
            }
        } else if (this.loginscreen === 2) {
            let y: number = ((this.sHei / 2) | 0) - 40;
            y += 30;

            y += 25;
            if (this.mouseClickButton === 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
                this.loginSelect = 0;
            }

            y += 15;
            if (this.mouseClickButton === 1 && this.mouseClickY >= y - 15 && this.mouseClickY < y) {
                this.loginSelect = 1;
            }
            // y += 15; dead code

            let x = ((this.sWid / 2) | 0) - 80;
            y = ((this.sHei / 2) | 0) + 50;
            y += 20;

            if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                await this.login(this.loginUser, this.loginPass, false);

                if (this.ingame) {
                    return;
                }
            }

            x = ((this.sWid / 2) | 0) + 80;
            if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.loginscreen = 0;
                this.loginUser = '';
                this.loginPass = '';
            }

            while (true) {
                const key: number = this.pollKey();
                if (key === -1) {
                    return;
                }

                let valid: boolean = false;
                for (let i: number = 0; i < PixFont.CHARSET.length; i++) {
                    if (String.fromCharCode(key) === PixFont.CHARSET.charAt(i)) {
                        valid = true;
                        break;
                    }
                }

                if (this.loginSelect === 0) {
                    if (key === 8 && this.loginUser.length > 0) {
                        this.loginUser = this.loginUser.substring(0, this.loginUser.length - 1);
                    }

                    if (key === 9 || key === 10 || key === 13) {
                        this.loginSelect = 1;
                    }

                    if (valid) {
                        this.loginUser = this.loginUser + String.fromCharCode(key);
                    }

                    if (this.loginUser.length > 12) {
                        this.loginUser = this.loginUser.substring(0, 12);
                    }
                } else if (this.loginSelect === 1) {
                    if (key === 8 && this.loginPass.length > 0) {
                        this.loginPass = this.loginPass.substring(0, this.loginPass.length - 1);
                    }

                    if (key === 9 || key === 10 || key === 13) {
                        this.loginSelect = 0;
                    }

                    if (valid) {
                        this.loginPass = this.loginPass + String.fromCharCode(key);
                    }

                    if (this.loginPass.length > 20) {
                        this.loginPass = this.loginPass.substring(0, 20);
                    }
                }
            }
        } else if (this.loginscreen === 3) {
            const x: number = (this.sWid / 2) | 0;
            let y: number = ((this.sHei / 2) | 0) + 50;

            y += 20;
            if (this.mouseClickButton === 1 && this.mouseClickX >= x - 75 && this.mouseClickX <= x + 75 && this.mouseClickY >= y - 20 && this.mouseClickY <= y + 20) {
                this.loginscreen = 0;
            }
        }
    }

    // jag::oldscape::Client::LoginPoll
    private async login(username: string, password: string, reconnect: boolean): Promise<void> {
        try {
            if (!reconnect) {
                this.loginMes1 = '';
                this.loginMes2 = 'Connecting to server...';
                await this.titleScreenDraw();
            }

            this.stream = new ClientStream(await ClientStream.openSocket(window.location.host, window.location.protocol === 'https:'));

            const username37 = JString.toBase37(username);
            const loginServer = Number(username37 >> 16n) & 0x1F;

            this.out.pos = 0;
            this.out.p1(14);
            this.out.p1(loginServer);

            this.stream.write(this.out.data, 2);
            for (let i = 0; i < 8; i++) {
                await this.stream.read();
            }

            let response: number = await this.stream.read();
            if (response === 0) {
                await this.stream.readBytes(this.in.data, 0, 8);
                this.in.pos = 0;

                this.serverSeed = this.in.g8();
                const seed: Int32Array = new Int32Array([Math.floor(Math.random() * 99999999), Math.floor(Math.random() * 99999999), Number(this.serverSeed >> 32n), Number(this.serverSeed & BigInt(0xffffffff))]);

                this.out.pos = 0;
                this.out.p1(10);
                this.out.p4(seed[0]);
                this.out.p4(seed[1]);
                this.out.p4(seed[2]);
                this.out.p4(seed[3]);
                this.out.p4(1337); // uid
                this.out.pjstr(username);
                this.out.pjstr(password);
                this.out.rsaenc(BigInt(process.env.LOGIN_RSAN!), BigInt(process.env.LOGIN_RSAE!));

                this.loginout.pos = 0;
                if (reconnect) {
                    this.loginout.p1(18);
                } else {
                    this.loginout.p1(16);
                }

                this.loginout.p1(this.out.pos + 36 + 1 + 1);
                this.loginout.p1(Constants.CLIENT_VERSION);
                this.loginout.p1(Client.lowMem ? 1 : 0);

                for (let i: number = 0; i < 9; i++) {
                    this.loginout.p4(this.jagChecksum[i]);
                }

                this.loginout.pdata(this.out.data, this.out.pos, 0);
                this.out.random = new Isaac(seed);
                for (let i: number = 0; i < 4; i++) {
                    seed[i] += 50;
                }
                this.randomIn = new Isaac(seed);
                this.stream?.write(this.loginout.data, this.loginout.pos);

                response = await this.stream.read();
            }

            if (response === 1) {
                await sleep(2000);
                await this.login(username, password, reconnect);
            } else if (response === 2) {
                this.staffmodlevel = await this.stream.read();
                this.mouseTracked = await this.stream.read() === 1;

                InputTracking.deactivate();
                this.prevMouseClickTime = 0;
                this.mouseTrackedDelta = 0;
                this.mouseTracking.length = 0;
                this.focus = true;
                this.focusIn = true;
                this.ingame = true;
                this.out.pos = 0;
                this.in.pos = 0;
                this.ptype = -1;
                this.ptype0 = -1;
                this.ptype1 = -1;
                this.ptype2 = -1;
                this.psize = 0;
                this.timeoutTimer = performance.now();
                this.rebootTimer = 0;
                this.logoutTimer = 0;
                this.hintType = 0;
                this.menuSize = 0;
                this.menuVisible = false;
                this.idleTimer = performance.now();

                for (let i: number = 0; i < 100; i++) {
                    this.messageText[i] = null;
                }

                this.objSelected = 0;
                this.spellSelected = 0;
                this.sceneState = 0;
                this.waveCount = 0;

                this.macroCameraX = ((Math.random() * 100.0) | 0) - 50;
                this.macroCameraZ = ((Math.random() * 110.0) | 0) - 55;
                this.macroCameraAngle = ((Math.random() * 80.0) | 0) - 40;
                this.macroMinimapAngle = ((Math.random() * 120.0) | 0) - 60;
                this.macroMinimapZoom = ((Math.random() * 30.0) | 0) - 20;
                this.orbitCameraYaw = (((Math.random() * 20.0) | 0) - 10) & 0x7ff;

                this.minimapLevel = -1;
                this.minimapFlagX = 0;
                this.minimapFlagZ = 0;

                this.playerCount = 0;
                this.npcCount = 0;

                for (let i: number = 0; i < Constants.MAX_PLAYER_COUNT; i++) {
                    this.players[i] = null;
                    this.playerAppearanceBuffer[i] = null;
                }

                for (let i: number = 0; i < 16384; i++) {
                    this.npc[i] = null;
                }

                this.localPlayer = this.players[Constants.LOCAL_PLAYER_INDEX] = new ClientPlayer();

                this.projectiles.clear();
                this.spotanims.clear();

                for (let level: number = 0; level < CollisionConstants.LEVELS; level++) {
                    for (let x: number = 0; x < CollisionConstants.SIZE; x++) {
                        for (let z: number = 0; z < CollisionConstants.SIZE; z++) {
                            this.objStacks[level][x][z] = null;
                        }
                    }
                }

                this.locChanges = new LinkList();
                this.friendListStatus = 0;
                this.friendCount = 0;
                this.tutLayerId = -1;
                this.chatLayerId = -1;
                this.mainLayerId = -1;
                this.sideLayerId = -1;
                this.mainOverlayLayerId = -1;
                this.resumedPauseButton = false;
                this.sideTab = 3;
                this.dialogInputOpen = false;
                this.menuVisible = false;
                this.socialInputOpen = false;
                this.modalMessage = null;
                this.inMultizone = 0;
                this.flashingTab = -1;

                this.designGender = true;
                this.validateCharacterDesign();
                for (let i: number = 0; i < 5; i++) {
                    this.designColours[i] = 0;
                }

                for (let i = 0; i < 5; i++) {
                    this.playerOp[i] = null;
                    this.playerOpPriority[i] = false;
                }

                Client.oplogic1 = 0;
                Client.oplogic2 = 0;
                Client.oplogic3 = 0;
                Client.oplogic4 = 0;
                Client.oplogic5 = 0;
                Client.oplogic6 = 0;
                Client.oplogic7 = 0;
                Client.oplogic8 = 0;
                Client.oplogic9 = 0;
                Client.oplogic10 = 0;

                this.prepareGame();
            } else if (response === 3) {
                this.loginMes1 = '';
                this.loginMes2 = 'Invalid username or password.';
            } else if (response === 4) {
                this.loginMes1 = 'Your account has been disabled.';
                this.loginMes2 = 'Please check your message-centre for details.';
            } else if (response === 5) {
                this.loginMes1 = 'Your account is already logged in.';
                this.loginMes2 = 'Try again in 60 secs...';
            } else if (response === 6) {
                this.loginMes1 = 'RuneScape has been updated!';
                this.loginMes2 = 'Please reload this page.';
            } else if (response === 7) {
                this.loginMes1 = 'This world is full.';
                this.loginMes2 = 'Please use a different world.';
            } else if (response === 8) {
                this.loginMes1 = 'Unable to connect.';
                this.loginMes2 = 'Login server offline.';
            } else if (response === 9) {
                this.loginMes1 = 'Login limit exceeded.';
                this.loginMes2 = 'Too many connections from your address.';
            } else if (response === 10) {
                this.loginMes1 = 'Unable to connect.';
                this.loginMes2 = 'Bad session id.';
            } else if (response === 11) {
                this.loginMes2 = 'Login server rejected session.'; // intentionally loginMessage1
                this.loginMes2 = 'Please try again.';
            } else if (response === 12) {
                this.loginMes1 = 'You need a members account to login to this world.';
                this.loginMes2 = 'Please subscribe, or use a different world.';
            } else if (response === 13) {
                this.loginMes1 = 'Could not complete login.';
                this.loginMes2 = 'Please try using a different world.';
            } else if (response === 14) {
                this.loginMes1 = 'The server is being updated.';
                this.loginMes2 = 'Please wait 1 minute and try again.';
            } else if (response === 15) {
                this.ingame = true;
                this.out.pos = 0;
                this.in.pos = 0;
                this.ptype = -1;
                this.ptype0 = -1;
                this.ptype1 = -1;
                this.ptype2 = -1;
                this.psize = 0;
                this.timeoutTimer = performance.now();
                this.rebootTimer = 0;
                this.menuSize = 0;
                this.menuVisible = false;
                this.sceneLoadStartTime = performance.now();
            } else if (response === 16) {
                this.loginMes1 = 'Login attempts exceeded.';
                this.loginMes2 = 'Please wait 1 minute and try again.';
            } else if (response === 17) {
                this.loginMes1 = 'You are standing in a members-only area.';
                this.loginMes2 = 'To play on this world move to a free area first';
            } else if (response === 20) {
                this.loginMes1 = 'Invalid loginserver requested';
                this.loginMes2 = 'Please try using a different world.';
            } else if (response === 21) {
                for (let remaining = await this.stream.read(); remaining >= 0; remaining--) {
                    this.loginMes1 = 'You have only just left another world';
                    this.loginMes2 = 'Your profile will be transferred in: ' + remaining + ' seconds.';
                    await this.titleScreenDraw();

                    await sleep(1000);
                }

                await this.login(username, password, reconnect);
            } else {
                console.log('response:' + response);
                this.loginMes1 = 'Unexpected server response';
                this.loginMes2 = 'Please try using a different world.';
            }
        } catch (e) {
            if (e instanceof WebSocket && e.readyState === 3) {
                // IO error
                this.loginMes1 = '';
                this.loginMes2 = 'Error connecting to server.';
            } else {
                // exceptions in Java get stuck permanently on "Connecting to server..."
                throw e;
            }
        }
    }

    // jag::oldscape::Client::Logout
    private async logout(): Promise<void> {
        if (this.stream) {
            this.stream.close();
        }

        this.stream = null;
        this.ingame = false;
        this.loginscreen = 0;
        this.loginUser = '';
        this.loginPass = '';

        InputTracking.deactivate();
        this.clearCaches();
        this.world?.resetMap();

        for (let level: number = 0; level < CollisionConstants.LEVELS; level++) {
            this.levelCollisionMap[level]?.reset();
        }

        stopMidi(false);
        this.nextMidiSong = -1;
        this.midiSong = -1;
        this.nextMusicDelay = 0;
    }

    private clearCaches(): void {
        LocType.mc1?.clear();
        LocType.mc2?.clear();
        NpcType.modelCache?.clear();
        ObjType.modelCache?.clear();
        ObjType.spriteCache?.clear();
        ClientPlayer.modelCache?.clear();
        SpotAnimType.modelCache?.clear();
    }

    private prepareGame(): void {
        if (this.areaChatback) {
            return;
        }

        this.unloadTitle();

        this.drawArea = null;
        this.imageTitle2 = null;
        this.imageTitle3 = null;
        this.imageTitle4 = null;
        this.imageTitle0 = null;
        this.imageTitle1 = null;
        this.imageTitle5 = null;
        this.imageTitle6 = null;
        this.imageTitle7 = null;
        this.imageTitle8 = null;

        this.areaChatback = new PixMap(479, 96);

        this.areaMapback = new PixMap(172, 156);
        Pix2D.cls();
        this.mapback?.plotSprite(0, 0);

        this.areaSidebar = new PixMap(190, 261);

        this.areaViewport = new PixMap(512, 334);
        Pix2D.cls();

        this.areaBackbase1 = new PixMap(496, 50);
        this.areaBackbase2 = new PixMap(269, 37);
        this.areaBackhmid1 = new PixMap(249, 45);

        this.redrawFrame = true;
    }

    // jag::oldscape::Client::GameLoop
    private async gameLoop(): Promise<void> {
        if (this.players === null) {
            // client is unloading asynchronously
            return;
        }

        if (this.rebootTimer > 1) {
            this.rebootTimer--;
        }

        if (this.logoutTimer > 0) {
            this.logoutTimer--;
        }

        for (let i: number = 0; i < 5 && (await this.tcpIn()); i++) {
            // empty
        }

        const now = performance.now();

        if (!this.ingame) {
            return;
        }

        if (!this.mouseTracked) {
            this.mouseTracking.length = 0;
        } else if (this.mouseClickButton !== 0 || this.mouseTracking.length >= 40) {
            this.out.pIsaac(ClientProt.EVENT_MOUSE_MOVE);
            this.out.p1(0);
            const start = this.out.pos;
            let count = 0;

            // custom: Java client checks `start - this.out.pos < 240` but this is obviously wrong
            //   and will lead to an invalid packet if the user is buffering a lot of mouse movements (i.e. while disconnected)
            for (let i = 0; i < this.mouseTracking.length && this.out.pos - start < 240; i++) {
                count++;

                let y = this.mouseTracking.y[i];
                if (y < 0) {
                    y = 0;
                } else if (y > 502) {
                    y = 502;
                }

                let x = this.mouseTracking.x[i];
                if (x < 0) {
                    x = 0;
                } else if (x > 764) {
                    x = 764;
                }

                let pos = y * 765 + x;
                if (this.mouseTracking.y[i] === -1 && this.mouseTracking.x[i] === -1) {
                    x = -1;
                    y = -1;
                    pos = 0x7FFFF;
                }

                if (x !== this.mouseTrackedX || y !== this.mouseTrackedY) {
                    let dx = x - this.mouseTrackedX;
                    this.mouseTrackedX = x;
                    let dy = y - this.mouseTrackedY;
                    this.mouseTrackedY = y;

                    if (this.mouseTrackedDelta < 8 && dx >= -32 && dx <= 31 && dy >= -32 && dy <= 31) {
                        dx += 32;
                        dy += 32;
                        this.out.p2((this.mouseTrackedDelta << 12) + (dx << 6) + dy);
                        this.mouseTrackedDelta = 0;
                    } else if (this.mouseTrackedDelta < 8) {
                        this.out.p3(0x800000 + (this.mouseTrackedDelta << 19) + pos);
                        this.mouseTrackedDelta = 0;
                    } else {
                        this.out.p4(0xC0000000 + (this.mouseTrackedDelta << 19) + pos);
                        this.mouseTrackedDelta = 0;
                    }
                } else if (this.mouseTrackedDelta < 2047) {
                    this.mouseTrackedDelta++;
                }
            }

            this.out.psize1(this.out.pos - start);

            if (count >= this.mouseTracking.length) {
                this.mouseTracking.length = 0;
            } else {
                this.mouseTracking.length -= count;

                for (let i = 0; i < this.mouseTracking.length; i++) {
                    this.mouseTracking.x[i] = this.mouseTracking.x[i + count];
                    this.mouseTracking.y[i] = this.mouseTracking.y[i + count];
                }
            }
        }

        if (this.mouseClickButton !== 0) {
            let delta = ((this.mouseClickTime - this.prevMouseClickTime) / 50) | 0;
            if (delta > 4095) {
                delta = 4095;
            }

            this.prevMouseClickTime = this.mouseClickTime;

            let y = this.mouseClickY;
            if (y < 0) {
                y = 0;
            } else if (y > 502) {
                y = 502;
            }

            let x = this.mouseClickX;
            if (x < 0) {
                x = 0;
            } else if (x > 764) {
                x = 764;
            }

            const pos = y * 765 + x;

            let button = 0;
            if (this.mouseClickButton === 2) {
                button = 1;
            }

            this.out.pIsaac(ClientProt.EVENT_MOUSE_CLICK);
            this.out.p4((delta << 20) + (button << 19) + pos);
        }

        if (this.sendCameraDelay > 0) {
            this.sendCameraDelay--;
        }

        if (this.keyHeld[1] === 1 || this.keyHeld[2] === 1 || this.keyHeld[3] === 1 || this.keyHeld[4] === 1) {
            this.sendCamera = true;
        }

        if (this.sendCamera && this.sendCameraDelay <= 0) {
            this.sendCameraDelay = 20;
            this.sendCamera = false;
            this.out.pIsaac(ClientProt.EVENT_CAMERA_POSITION);
            this.out.p2(this.orbitCameraPitch);
            this.out.p2(this.orbitCameraYaw);
        }

        if (this.focus && !this.focusIn) {
            this.focusIn = true;
            this.out.pIsaac(ClientProt.EVENT_APPLET_FOCUS);
            this.out.p1(1);
        } else if (!this.focus && this.focusIn) {
            this.focusIn = false;
            this.out.pIsaac(ClientProt.EVENT_APPLET_FOCUS);
            this.out.p1(0);
        }

        this.checkMinimap();
        this.locChangeDoQueue();
        await this.soundsDoQueue();

        const tracking: Packet | null = InputTracking.flush();
        if (tracking) {
            this.out.pIsaac(ClientProt.EVENT_TRACKING);
            this.out.p2(tracking.pos);
            this.out.pdata(tracking.data, tracking.pos, 0);
            tracking.release();
        }

        if (now - this.timeoutTimer > 15_000) {
            // no packets received recently, connection lost
            await this.tryReconnect();
        }

        this.movePlayers();
        this.moveNpcs();
        this.timeoutChat();

        this.sceneDelta++;

        if (this.crossMode !== 0) {
            this.crossCycle += 20;

            if (this.crossCycle >= 400) {
                this.crossMode = 0;
            }
        }

        if (this.selectedArea !== 0) {
            this.selectedCycle++;

            if (this.selectedCycle >= 15) {
                if (this.selectedArea === 2) {
                    this.redrawSidebar = true;
                }
                if (this.selectedArea === 3) {
                    this.redrawChatback = true;
                }

                this.selectedArea = 0;
            }
        }

        if (this.objDragArea !== 0) {
            this.objDragCycles++;

            if (this.mouseX > this.objGrabX + 5 || this.mouseX < this.objGrabX - 5 || this.mouseY > this.objGrabY + 5 || this.mouseY < this.objGrabY - 5) {
                this.objGrabThreshold = true;
            }

            if (this.mouseButton === 0) {
                if (this.objDragArea === 2) {
                    this.redrawSidebar = true;
                }
                if (this.objDragArea === 3) {
                    this.redrawChatback = true;
                }

                this.objDragArea = 0;

                if (this.objGrabThreshold && this.objDragCycles >= 5) {
                    this.hoveredSlotParentId = -1;
                    this.buildMinimenu();

                    if (this.hoveredSlotParentId === this.objDragLayerId && this.hoveredSlot !== this.objDragSlot) {
                        const com: IfType = IfType.list[this.objDragLayerId];

                        let mode = 0;
                        if (this.bankArrangeMode == 1 && com.clientCode == ClientCode.CC_BANKMODE) {
                            mode = 1;
                        }
                        if (com.linkObjType && com.linkObjType[this.hoveredSlot] <= 0) {
                            mode = 0;
                        }

                        if (com.swappable && com.linkObjType && com.linkObjCount) {
                            const src = this.objDragSlot;
                            const dst = this.hoveredSlot;

                            com.linkObjType[dst] = com.linkObjType[src];
                            com.linkObjCount[dst] = com.linkObjCount[src];
                            com.linkObjType[src] = -1;
                            com.linkObjCount[src] = 0;
                        } else if (mode == 1) {
                            let src = this.objDragSlot;
                            const dst = this.hoveredSlot;

                            while (src != dst) {
                                if (src > dst) {
                                    com.swapObj(src, src - 1);
                                    src--;
                                } else if (src < dst) {
                                    com.swapObj(src, src + 1);
                                    src++;
                                }
                            }
                        } else {
                            com.swapObj(this.objDragSlot, this.hoveredSlot);
                        }

                        this.out.pIsaac(ClientProt.INV_BUTTOND);
                        this.out.p2(this.objDragLayerId);
                        this.out.p2(this.objDragSlot);
                        this.out.p2(this.hoveredSlot);
                        this.out.p1(mode);
                    }
                } else if ((this.oneMouseButton === 1 || this.isAddFriendOption(this.menuSize - 1)) && this.menuSize > 2) {
                    this.showContextMenu();
                } else if (this.menuSize > 0) {
                    this.useMenuOption(this.menuSize - 1);
                }

                this.selectedCycle = 10;
                this.mouseClickButton = 0;
            }
        }

        Client.cyclelogic7++;
        if (Client.cyclelogic7 > 62) {
            Client.cyclelogic7 = 0;

            this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC7);
        }

        if (World.groundX !== -1) {
            if (this.localPlayer) {
                const x: number = World.groundX;
                const z: number = World.groundZ;
                const success: boolean = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 0, 0, 0, 0, 0, 0, true);
                World.groundX = -1;

                if (success) {
                    this.crossX = this.mouseClickX;
                    this.crossY = this.mouseClickY;
                    this.crossMode = 1;
                    this.crossCycle = 0;
                }
            }
        }

        if (this.mouseClickButton === 1 && this.modalMessage) {
            this.modalMessage = null;
            this.redrawChatback = true;
            this.mouseClickButton = 0;
        }

        const checkClickInput = !this.isMobile || (this.isMobile && !MobileKeyboard.isWithinCanvasKeyboard(this.mouseClickX, this.mouseClickY));

        if (checkClickInput) {
            this.handleMouseInput();
            this.handleMinimapInput();
            this.handleTabInput();
            this.handleChatModeInput();
        }

        if (this.mouseButton === 1 || this.mouseClickButton === 1) {
            this.dragCycles++;
        }

        if (this.sceneState === 2) {
            this.followCamera();
        }

        if (this.sceneState === 2 && this.cinemaCam) {
            this.cinemaCamera();
        }

        for (let i: number = 0; i < 5; i++) {
            this.camShakeCycle[i]++;
        }

        await this.handleInputKey();

        // if (now - this.idleTimer > 90_000) {
        //     // no input in 90s, notify the server
        //     this.pendingLogout = 250;
        //     this.idleTimer += 10_000; // 10s backoff

        //     this.out.pIsaac(ClientProt.IDLE_TIMER);
        // }

        this.macroCameraCycle++;
        if (this.macroCameraCycle > 500) {
            this.macroCameraCycle = 0;

            const rand: number = (Math.random() * 8.0) | 0;
            if ((rand & 0x1) === 1) {
                this.macroCameraX += this.macroCameraXModifier;
            }
            if ((rand & 0x2) === 2) {
                this.macroCameraZ += this.macroCameraZModifier;
            }
            if ((rand & 0x4) === 4) {
                this.macroCameraAngle += this.macroCameraAngleModifier;
            }
        }

        if (this.macroCameraX < -50) {
            this.macroCameraXModifier = 2;
        }
        if (this.macroCameraX > 50) {
            this.macroCameraXModifier = -2;
        }

        if (this.macroCameraZ < -55) {
            this.macroCameraZModifier = 2;
        }
        if (this.macroCameraZ > 55) {
            this.macroCameraZModifier = -2;
        }

        if (this.macroCameraAngle < -40) {
            this.macroCameraAngleModifier = 1;
        }
        if (this.macroCameraAngle > 40) {
            this.macroCameraAngleModifier = -1;
        }

        this.macroMinimapCycle++;
        if (this.macroMinimapCycle > 500) {
            this.macroMinimapCycle = 0;

            const rand: number = (Math.random() * 8.0) | 0;
            if ((rand & 0x1) === 1) {
                this.macroMinimapAngle += this.macroMinimapAngleModifier;
            }
            if ((rand & 0x2) === 2) {
                this.macroMinimapZoom += this.macroMinimapZoomModifier;
            }
        }

        if (this.macroMinimapAngle < -60) {
            this.macroMinimapAngleModifier = 2;
        }
        if (this.macroMinimapAngle > 60) {
            this.macroMinimapAngleModifier = -2;
        }

        if (this.macroMinimapZoom < -20) {
            this.macroMinimapZoomModifier = 1;
        }
        if (this.macroMinimapZoom > 10) {
            this.macroMinimapZoomModifier = -1;
        }

        if (now - this.noTimeoutCycle > 1_000) {
            // nothing sent in the last 1s, keep the client connected
            this.out.pIsaac(ClientProt.NO_TIMEOUT);
        }

        try {
            if (this.stream && this.out.pos > 0) {
                this.stream.write(this.out.data, this.out.pos);
                this.out.pos = 0;
                this.noTimeoutCycle = now;
            }
        } catch (e) {
            if (e instanceof WebSocket && e.readyState === 3) {
                // IO error
                await this.tryReconnect();
            } else {
                // logic error
                await this.logout();
            }
        }
    }

    private async tryReconnect() {
        if (this.logoutTimer > 0) {
            await this.logout();
            return;
        }

        this.areaViewport?.bind();
        this.fontPlain12?.centreString(257, 144, 'Connection lost', Colour.BLACK);
        this.fontPlain12?.centreString(256, 143, 'Connection lost', Colour.WHITE);
        this.fontPlain12?.centreString(257, 159, 'Please wait - attempting to reestablish', Colour.BLACK);
        this.fontPlain12?.centreString(256, 158, 'Please wait - attempting to reestablish', Colour.WHITE);
        this.areaViewport?.draw(4, 4);

        this.minimapFlagX = 0;

        this.stream?.close();

        this.ingame = false;
        await this.login(this.loginUser, this.loginPass, true);
        if (!this.ingame) {
            await this.logout();
        }
    }

    // jag::oldscape::Client::GlCheckMinimap
    private checkMinimap(): void {
        if (Client.lowMem && this.sceneState === 2 && ClientBuild.minusedlevel !== this.minusedlevel) {
            this.areaViewport?.bind();
            this.fontPlain12?.centreString(257, 151, 'Loading - please wait.', Colour.BLACK);
            this.fontPlain12?.centreString(256, 150, 'Loading - please wait.', Colour.WHITE);
            this.areaViewport?.draw(4, 4);
            this.sceneState = 1;
            this.sceneLoadStartTime = performance.now();
        }

        if (this.sceneState === 1) {
            const status = this.checkScene();
            if (status != 0 && performance.now() - this.sceneLoadStartTime > 360000) {
                console.log(`${this.loginUser} glcfb ${this.serverSeed},${status},${Client.lowMem},${this.db !== null},${this.onDemand?.remaining()},${this.minusedlevel},${this.mapBuildCenterZoneX},${this.mapBuildCenterZoneZ}`);
                this.sceneLoadStartTime = performance.now();
            }
        }

        if (this.sceneState === 2 && this.minusedlevel !== this.minimapLevel) {
            this.minimapLevel = this.minusedlevel;
            this.minimapBuildBuffer(this.minusedlevel);
        }
    }

    private checkScene(): number {
        if (!this.mapBuildIndex || !this.mapBuildGroundData || !this.mapBuildLocationData) {
            return -1000; // custom
        }

        for (let i = 0; i < this.mapBuildGroundData.length; i++) {
            if (this.mapBuildGroundData[i] == null && this.mapBuildGroundFile[i] !== -1) {
                return -1;
            }

            if (this.mapBuildLocationData[i] == null && this.mapBuildLocationFile[i] !== -1) {
                return -2;
            }
        }

        let ready = true;
        for (let i = 0; i < this.mapBuildGroundData.length; i++) {
            const data = this.mapBuildLocationData[i];
            if (data != null) {
                const x = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
                const z = (this.mapBuildIndex[i] & 0xFF) * 64 - this.mapBuildBaseZ;
                if (!ClientBuild.checkLocations(data, x, z)) {
                    ready = false;
                }
            }
        }

        if (!ready) {
            return -3;
        } else if (this.awaitingPlayerInfo) {
            return -4;
        }

        this.sceneState = 2;
        ClientBuild.minusedlevel = this.minusedlevel;
        this.mapBuild();
        this.out.pIsaac(ClientProt.MAP_BUILD_COMPLETE);
        return 0;
    }

    // jag::oldscape::Client::MapBuildLoop
    private mapBuild(): void {
        try {
            this.minimapLevel = -1;
            this.spotanims.clear();
            this.projectiles.clear();
            Pix3D.clearTexels();
            this.clearCaches();
            this.world?.resetMap();

            for (let level: number = 0; level < CollisionConstants.LEVELS; level++) {
                this.levelCollisionMap[level]?.reset();
            }

            const build: ClientBuild = new ClientBuild(CollisionConstants.SIZE, CollisionConstants.SIZE, this.groundh!, this.mapl!);
            const maps: number = this.mapBuildGroundData?.length ?? 0;

            ClientBuild.lowMem = World.lowMem;

            if (this.mapBuildIndex) {
                for (let index: number = 0; index < maps; index++) {
                    const x: number = this.mapBuildIndex[index] >> 8;
                    const z: number = this.mapBuildIndex[index] & 0xff;

                    // underground pass check
                    if (x === 33 && z >= 71 && z <= 73) {
                        ClientBuild.lowMem = false;
                        break;
                    }
                }
            }

            if (ClientBuild.lowMem) {
                this.world?.fillBaseLevel(this.minusedlevel);
            } else {
                this.world?.fillBaseLevel(0);
            }

            if (this.mapBuildIndex && this.mapBuildGroundData) {
                this.out.pIsaac(ClientProt.NO_TIMEOUT);

                for (let i: number = 0; i < maps; i++) {
                    const x: number = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
                    const z: number = (this.mapBuildIndex[i] & 0xff) * 64 - this.mapBuildBaseZ;
                    const data: Uint8Array | null = this.mapBuildGroundData[i];

                    if (data) {
                        build.loadGround((this.mapBuildCenterZoneX - 6) * 8, (this.mapBuildCenterZoneZ - 6) * 8, x, z, data);
                    }
                }

                for (let i: number = 0; i < maps; i++) {
                    const x: number = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
                    const z: number = (this.mapBuildIndex[i] & 0xff) * 64 - this.mapBuildBaseZ;
                    const data: Uint8Array | null = this.mapBuildGroundData[i];

                    if (!data && this.mapBuildCenterZoneZ < 800) {
                        build.fadeAdjacent(z, x, 64, 64);
                    }
                }
            }

            if (this.mapBuildIndex && this.mapBuildLocationData) {
                this.out.pIsaac(ClientProt.NO_TIMEOUT);

                for (let i: number = 0; i < maps; i++) {
                    const data: Uint8Array | null = this.mapBuildLocationData[i];

                    if (data) {
                        const x: number = (this.mapBuildIndex[i] >> 8) * 64 - this.mapBuildBaseX;
                        const z: number = (this.mapBuildIndex[i] & 0xff) * 64 - this.mapBuildBaseZ;
                        build.loadLocations(this.loopCycle, this.world, this.levelCollisionMap, data, x, z);
                    }
                }
            }

            this.out.pIsaac(ClientProt.NO_TIMEOUT);

            build.finishBuild(this.world, this.levelCollisionMap);
            this.areaViewport?.bind();

            this.out.pIsaac(ClientProt.NO_TIMEOUT);

            for (let x: number = 0; x < CollisionConstants.SIZE; x++) {
                for (let z: number = 0; z < CollisionConstants.SIZE; z++) {
                    this.showObject(x, z);
                }
            }

            this.locChangePostBuildCorrect();
        } catch (e) {
            console.error(e);
        }

        LocType.mc1?.clear();

        if (Client.lowMem && this.db) {
            const modelCount = this.onDemand?.getFileCount(0) ?? 0;

            for (let i = 0; i < modelCount; i++) {
                const flags = this.onDemand?.getModelUse(i) ?? 0;

                if ((flags & 0x79) == 0) {
                    Model.unload(i);
                }
            }
        }

        Pix3D.initPool(20);
        this.onDemand?.clearPrefetches();

        let left = (this.mapBuildCenterZoneX - 6) / 8 - 1;
        let right = (this.mapBuildCenterZoneX + 6) / 8 + 1;
        let bottom = (this.mapBuildCenterZoneZ - 6) / 8 - 1;
        let top = (this.mapBuildCenterZoneZ + 6) / 8 + 1;

        if (this.withinTutorialIsland) {
            left = 49;
            right = 50;
            bottom = 49;
            top = 50;
        }

        for (let x = left; x <= right; x++) {
            for (let z = bottom; z <= top; z++) {
                if (left == x || right == x || bottom == z || top == z) {
                    const land = this.onDemand?.getMapFile(z, x, 0) ?? -1;
                    if (land != -1) {
                        this.onDemand?.prefetch(3, land);
                    }

                    const loc = this.onDemand?.getMapFile(z, x, 1) ?? -1;
                    if (loc != -1) {
                        this.onDemand?.prefetch(3, loc);
                    }
                }
            }
        }
    }

    // jag::oldscape::Client::LocChangePostBuildCorrect
    private locChangePostBuildCorrect(): void {
        for (let loc = this.locChanges.head(); loc !== null; loc = this.locChanges.next()) {
            if (loc.endTime === -1) {
                loc.startTime = 0;
                this.locChangeSetOld(loc);
            } else {
                loc.unlink();
            }
        }
    }

    // jag::oldscape::minimap::Minimap::BuildBuffer
    private minimapBuildBuffer(level: number): void {
        if (!this.minimap) {
            return;
        }

        const pixels: Int32Array = this.minimap.data;
        const length: number = pixels.length;
        for (let i: number = 0; i < length; i++) {
            pixels[i] = 0;
        }

        for (let z: number = 1; z < CollisionConstants.SIZE - 1; z++) {
            let offset: number = (CollisionConstants.SIZE - 1 - z) * 512 * 4 + 24628;

            for (let x: number = 1; x < CollisionConstants.SIZE - 1; x++) {
                if (this.mapl && (this.mapl[level][x][z] & (MapFlag.VisBelow | MapFlag.ForceHighDetail)) === 0) {
                    this.world?.render2DGround(level, x, z, pixels, offset, 512);
                }

                if (level < 3 && this.mapl && (this.mapl[level + 1][x][z] & MapFlag.VisBelow) !== 0) {
                    this.world?.render2DGround(level + 1, x, z, pixels, offset, 512);
                }

                offset += 4;
            }
        }

        const inactiveRgb: number = ((((Math.random() * 20.0) | 0) + 238 - 10) << 16) + ((((Math.random() * 20.0) | 0) + 238 - 10) << 8) + ((Math.random() * 20.0) | 0) + 238 - 10;
        const activeRgb: number = (((Math.random() * 20.0) | 0) + 238 - 10) << 16;

        this.minimap.setPixels();

        for (let z: number = 1; z < CollisionConstants.SIZE - 1; z++) {
            for (let x: number = 1; x < CollisionConstants.SIZE - 1; x++) {
                if (this.mapl && (this.mapl[level][x][z] & (MapFlag.VisBelow | MapFlag.ForceHighDetail)) === 0) {
                    this.drawDetail(x, z, level, inactiveRgb, activeRgb);
                }

                if (level < 3 && this.mapl && (this.mapl[level + 1][x][z] & MapFlag.VisBelow) !== 0) {
                    this.drawDetail(x, z, level + 1, inactiveRgb, activeRgb);
                }
            }
        }

        this.areaViewport?.bind();

        this.activeMapFunctionCount = 0;

        for (let x: number = 0; x < CollisionConstants.SIZE; x++) {
            for (let z: number = 0; z < CollisionConstants.SIZE; z++) {
                const typecode: number = this.world?.gdType(this.minusedlevel, x, z) ?? 0;
                if (typecode === 0) {
                    continue;
                }

                const locId = (typecode >> 14) & 0x7fff;
                const func: number = LocType.get(locId).mapfunction;
                if (func < 0) {
                    continue;
                }

                let stx: number = x;
                let stz: number = z;

                if (func !== 22 && func !== 29 && func !== 34 && func !== 36 && func !== 46 && func !== 47 && func !== 48) {
                    const maxX: number = CollisionConstants.SIZE;
                    const maxZ: number = CollisionConstants.SIZE;
                    const collisionmap: CollisionMap | null = this.levelCollisionMap[this.minusedlevel];

                    if (collisionmap) {
                        const flags: Int32Array = collisionmap.flags;

                        for (let i: number = 0; i < 10; i++) {
                            const rand: number = (Math.random() * 4.0) | 0;
                            if (rand === 0 && stx > 0 && stx > x - 3 && (flags[CollisionMap.index(stx - 1, stz)] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                                stx--;
                            }

                            if (rand === 1 && stx < maxX - 1 && stx < x + 3 && (flags[CollisionMap.index(stx + 1, stz)] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                                stx++;
                            }

                            if (rand === 2 && stz > 0 && stz > z - 3 && (flags[CollisionMap.index(stx, stz - 1)] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                                stz--;
                            }

                            if (rand === 3 && stz < maxZ - 1 && stz < z + 3 && (flags[CollisionMap.index(stx, stz + 1)] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                                stz++;
                            }
                        }
                    }
                }

                this.activeMapFunctions[this.activeMapFunctionCount] = this.mapfunction[func];
                this.activeMapFunctionX[this.activeMapFunctionCount] = stx;
                this.activeMapFunctionZ[this.activeMapFunctionCount] = stz;
                this.activeMapFunctionCount++;
            }
        }

        Client.cyclelogic3++;
        if (Client.cyclelogic3 > 112) {
            Client.cyclelogic3 = 0;

            this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC3);
            this.out.p1(50);
        }
    }

    // jag::oldscape::Client::LocChangeDoQueue
    private locChangeDoQueue(): void {
        if (this.sceneState !== 2) {
            return;
        }

        for (let loc = this.locChanges.head(); loc !== null; loc = this.locChanges.next()) {
            if (loc.endTime > 0) {
                loc.endTime--;
            }

            if (loc.endTime != 0) {
                if (loc.startTime > 0) {
                    loc.startTime--;
                }

                if (loc.startTime === 0 && loc.x >= 1 && loc.z >= 1 && loc.x <= 102 && loc.z <= 102 && (loc.newType < 0 || ClientBuild.changeLocAvailable(loc.newType, loc.newShape))) {
                    this.locChangeUnchecked(loc.level, loc.x, loc.z, loc.newType, loc.newAngle, loc.newShape, loc.layer);
                    loc.startTime = -1;

                    if (loc.oldType === loc.newType && loc.oldType === -1) {
                        loc.unlink();
                    } else if (loc.oldType === loc.newType && loc.oldAngle === loc.newAngle && loc.oldShape === loc.newShape) {
                        loc.unlink();
                    }
                }
            } else if (loc.oldType < 0 || ClientBuild.changeLocAvailable(loc.oldType, loc.oldShape)) {
                this.locChangeUnchecked(loc.level, loc.x, loc.z, loc.oldType, loc.oldAngle, loc.oldShape, loc.layer);
                loc.unlink();
            }
        }
    }

    // jag::oldscape::Client::GlDoSoundsQueue
    async soundsDoQueue() {
        for (let wave: number = 0; wave < this.waveCount; wave++) {
            if (this.waveDelay[wave] <= 0) {
                try {
                    const buf: Packet | null = Wave.generate(this.waveIds[wave], this.waveLoops[wave]);
                    if (!buf) {
                        throw new Error();
                    }

                    if (performance.now() + ((buf.pos / 22) | 0) > this.lastWaveStartTime + ((this.lastWaveLength / 22) | 0)) {
                        this.lastWaveLength = buf.pos;
                        this.lastWaveStartTime = performance.now();
                        this.lastWaveId = this.waveIds[wave];
                        this.lastWaveLoops = this.waveLoops[wave];
                        await playWave(buf.data.slice(0, buf.pos));
                    }
                } catch (_e) {
                    // empty
                }

                this.waveCount--;
                for (let i: number = wave; i < this.waveCount; i++) {
                    this.waveIds[i] = this.waveIds[i + 1];
                    this.waveLoops[i] = this.waveLoops[i + 1];
                    this.waveDelay[i] = this.waveDelay[i + 1];
                }
                wave--;
            } else {
                this.waveDelay[wave]--;
            }
        }

        if (this.nextMusicDelay > 0) {
            this.nextMusicDelay -= 20;

            if (this.nextMusicDelay < 0) {
                this.nextMusicDelay = 0;
            }

            if (this.nextMusicDelay === 0 && this.midiActive && !Client.lowMem) {
                this.midiSong = this.nextMidiSong;
                this.midiFading = false;
                this.onDemand?.request(2, this.midiSong);
            }
        }
    }

    // jag::oldscape::minimenu::Minimenu::Build
    private buildMinimenu(): void {
        if (this.objDragArea !== 0) {
            return;
        }

        this.menuOption[0] = 'Cancel';
        this.menuAction[0] = MenuAction.CANCEL;
        this.menuSize = 1;

        this.addPrivateChatOptions();
        this.lastOverLayerId = 0;

        // the main viewport area
        if (this.mouseX > 4 && this.mouseY > 4 && this.mouseX < 516 && this.mouseY < 338) {
            if (this.mainLayerId === -1) {
                this.addViewportOptions();
            } else {
                this.addComponentOptions(IfType.list[this.mainLayerId], this.mouseX, this.mouseY, 4, 4, 0);
            }
        }

        if (this.lastOverLayerId !== this.overMainLayerId) {
            this.overMainLayerId = this.lastOverLayerId;
        }

        this.lastOverLayerId = 0;

        // the sidebar/tabs area
        if (this.mouseX > 553 && this.mouseY > 205 && this.mouseX < 743 && this.mouseY < 466) {
            if (this.sideLayerId !== -1) {
                this.addComponentOptions(IfType.list[this.sideLayerId], this.mouseX, this.mouseY, 553, 205, 0);
            } else if (this.sideTabLayerId[this.sideTab] !== -1) {
                this.addComponentOptions(IfType.list[this.sideTabLayerId[this.sideTab]], this.mouseX, this.mouseY, 553, 205, 0);
            }
        }

        if (this.lastOverLayerId !== this.overSideLayerId) {
            this.redrawSidebar = true;
            this.overSideLayerId = this.lastOverLayerId;
        }

        this.lastOverLayerId = 0;

        // the chatbox area
        if (this.mouseX > 17 && this.mouseY > 357 && this.mouseX < 426 && this.mouseY < 453) {
            if (this.chatLayerId !== -1) {
                this.addComponentOptions(IfType.list[this.chatLayerId], this.mouseX, this.mouseY, 17, 357, 0);
            } else if (this.mouseY < 434) {
                this.addChatOptions(this.mouseX - 17, this.mouseY - 357);
            }
        }

        if (this.chatLayerId !== -1 && this.lastOverLayerId !== this.overChatLayerId) {
            this.redrawChatback = true;
            this.overChatLayerId = this.lastOverLayerId;
        }

        let sorted: boolean = false;
        while (!sorted) {
            sorted = true;

            for (let i: number = 0; i < this.menuSize - 1; i++) {
                if (this.menuAction[i] < 1000 && this.menuAction[i + 1] > 1000) {
                    const tmp0: string = this.menuOption[i];
                    this.menuOption[i] = this.menuOption[i + 1];
                    this.menuOption[i + 1] = tmp0;

                    const tmp1: number = this.menuAction[i];
                    this.menuAction[i] = this.menuAction[i + 1];
                    this.menuAction[i + 1] = tmp1;

                    const tmp2: number = this.menuParamB[i];
                    this.menuParamB[i] = this.menuParamB[i + 1];
                    this.menuParamB[i + 1] = tmp2;

                    const tmp3: number = this.menuParamC[i];
                    this.menuParamC[i] = this.menuParamC[i + 1];
                    this.menuParamC[i + 1] = tmp3;

                    const tmp4: number = this.menuParamA[i];
                    this.menuParamA[i] = this.menuParamA[i + 1];
                    this.menuParamA[i + 1] = tmp4;

                    sorted = false;
                }
            }
        }
    }

    private addPrivateChatOptions(): void {
        if (this.splitPrivateChat === 0) {
            return;
        }

        let line: number = 0;
        if (this.rebootTimer !== 0) {
            line = 1;
        }

        for (let i: number = 0; i < 100; i++) {
            if (this.messageText[i] !== null) {
                const type: number = this.messageType[i];
                let sender = this.messageSender[i];

                let _mod = false;
                if (sender && sender.startsWith('@cr1@')) {
                    sender = sender.substring(5);
                    _mod = true;
                } else if (sender && sender.startsWith('@cr2@')) {
                    sender = sender.substring(5);
                    _mod = true;
                }

                if ((type === 3 || type === 7) && (type === 7 || this.chatPrivateMode === 0 || (this.chatPrivateMode === 1 && this.isFriend(sender)))) {
                    const y: number = 329 - line * 13;

                    if (this.mouseX > 4 && this.mouseX < 516 && this.mouseY - 4 > y - 10 && this.mouseY - 4 <= y + 3) {
                        if (this.staffmodlevel) {
                            this.menuOption[this.menuSize] = 'Report abuse @whi@' + sender;
                            this.menuAction[this.menuSize] = MenuAction._PRIORITY + MenuAction.REPORT_ABUSE;
                            this.menuSize++;
                        }

                        this.menuOption[this.menuSize] = 'Add ignore @whi@' + sender;
                        this.menuAction[this.menuSize] = MenuAction._PRIORITY + MenuAction.IGNORELIST_ADD;
                        this.menuSize++;

                        this.menuOption[this.menuSize] = 'Add friend @whi@' + sender;
                        this.menuAction[this.menuSize] = MenuAction._PRIORITY + MenuAction.FRIENDLIST_ADD;
                        this.menuSize++;
                    }

                    line++;
                    if (line >= 5) {
                        return;
                    }
                } else if ((type === 5 || type === 6) && this.chatPrivateMode < 2) {
                    line++;
                    if (line >= 5) {
                        return;
                    }
                }
            }
        }
    }

    private addChatOptions(_mouseX: number, mouseY: number): void {
        let line: number = 0;
        for (let i: number = 0; i < 100; i++) {
            if (!this.messageText[i]) {
                continue;
            }

            const type: number = this.messageType[i];
            const y: number = this.chatScrollOffset + 70 + 4 - line * 14;
            if (y < -20) {
                break;
            }

            let sender = this.messageSender[i];
            let _mod = false;
            if (sender && sender.startsWith('@cr1@')) {
                sender = sender.substring(5);
                _mod = true;
            } else if (sender && sender.startsWith('@cr2@')) {
                sender = sender.substring(5);
                _mod = true;
            }

            if (type === 0) {
                line++;
            } else if ((type == 1 || type == 2) && (type == 1 || this.chatPublicMode == 0 || this.chatPublicMode == 1 && this.isFriend(sender))) {
                if (mouseY > y - 14 && mouseY <= y && this.localPlayer && sender !== this.localPlayer.name) {
                    if (this.staffmodlevel >= 1) {
                        this.menuOption[this.menuSize] = 'Report abuse @whi@' + sender;
                        this.menuAction[this.menuSize] = MenuAction.REPORT_ABUSE;
                        this.menuSize++;
                    }

                    this.menuOption[this.menuSize] = 'Add ignore @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.IGNORELIST_ADD;
                    this.menuSize++;

                    this.menuOption[this.menuSize] = 'Add friend @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.FRIENDLIST_ADD;
                    this.menuSize++;
                }

                line++;
            } else if ((type === 3 || type === 7) && this.splitPrivateChat === 0 && (type === 7 || this.chatPrivateMode === 0 || (this.chatPrivateMode === 1 && this.isFriend(sender)))) {
                if (mouseY > y - 14 && mouseY <= y) {
                    if (this.staffmodlevel >= 1) {
                        this.menuOption[this.menuSize] = 'Report abuse @whi@' + sender;
                        this.menuAction[this.menuSize] = MenuAction.REPORT_ABUSE;
                        this.menuSize++;
                    }

                    this.menuOption[this.menuSize] = 'Add ignore @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.IGNORELIST_ADD;
                    this.menuSize++;

                    this.menuOption[this.menuSize] = 'Add friend @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.FRIENDLIST_ADD;
                    this.menuSize++;
                }

                line++;
            } else if (type === 4 && (this.chatTradeMode === 0 || (this.chatTradeMode === 1 && this.isFriend(sender)))) {
                if (mouseY > y - 14 && mouseY <= y) {
                    this.menuOption[this.menuSize] = 'Accept trade @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.OPPLAYER_TRADEREQ;
                    this.menuSize++;
                }

                line++;
            } else if ((type === 5 || type === 6) && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
                line++;
            } else if (type === 8 && (this.chatTradeMode === 0 || (this.chatTradeMode === 1 && this.isFriend(sender)))) {
                if (mouseY > y - 14 && mouseY <= y) {
                    this.menuOption[this.menuSize] = 'Accept duel @whi@' + sender;
                    this.menuAction[this.menuSize] = MenuAction.OPPLAYER_DUELREQ;
                    this.menuSize++;
                }

                line++;
            }
        }
    }

    private addViewportOptions(): void {
        if (this.objSelected === 0 && this.spellSelected === 0) {
            this.menuOption[this.menuSize] = 'Walk here';
            this.menuAction[this.menuSize] = MenuAction.WALK;
            this.menuParamB[this.menuSize] = this.mouseX;
            this.menuParamC[this.menuSize] = this.mouseY;
            this.menuSize++;
        }

        let lastTypecode: number = -1;
        for (let picked: number = 0; picked < Model.pickedCount; picked++) {
            const typecode: number = Model.pickedBitsets[picked];
            const x: number = typecode & 0x7f;
            const z: number = (typecode >> 7) & 0x7f;
            const entityType: number = (typecode >> 29) & 0x3;
            const typeId: number = (typecode >> 14) & 0x7fff;

            if (typecode === lastTypecode) {
                continue;
            }

            lastTypecode = typecode;

            if (entityType === 2 && this.world && this.world.typecode2(this.minusedlevel, x, z, typecode) >= 0) {
                const loc: LocType = LocType.get(typeId);

                if (this.objSelected === 1) {
                    this.menuOption[this.menuSize] = 'Use ' + this.objSelectedName + ' with @cya@' + loc.name;
                    this.menuAction[this.menuSize] = MenuAction.OPLOCU;
                    this.menuParamA[this.menuSize] = typecode;
                    this.menuParamB[this.menuSize] = x;
                    this.menuParamC[this.menuSize] = z;
                    this.menuSize++;
                } else if (this.spellSelected !== 1) {
                    if (loc.op) {
                        for (let i: number = 4; i >= 0; i--) {
                            if (loc.op[i]) {
                                this.menuOption[this.menuSize] = loc.op[i] + ' @cya@' + loc.name;

                                if (i === 0) {
                                    this.menuAction[this.menuSize] = MenuAction.OPLOC1;
                                } else if (i === 1) {
                                    this.menuAction[this.menuSize] = MenuAction.OPLOC2;
                                } else if (i === 2) {
                                    this.menuAction[this.menuSize] = MenuAction.OPLOC3;
                                } else if (i === 3) {
                                    this.menuAction[this.menuSize] = MenuAction.OPLOC4;
                                } else if (i === 4) {
                                    this.menuAction[this.menuSize] = MenuAction.OPLOC5;
                                }

                                this.menuParamA[this.menuSize] = typecode;
                                this.menuParamB[this.menuSize] = x;
                                this.menuParamC[this.menuSize] = z;
                                this.menuSize++;
                            }
                        }
                    }

                    this.menuOption[this.menuSize] = 'Examine @cya@' + loc.name;
                    this.menuAction[this.menuSize] = MenuAction.OPLOC6;
                    this.menuParamA[this.menuSize] = typecode;
                    this.menuParamB[this.menuSize] = x;
                    this.menuParamC[this.menuSize] = z;
                    this.menuSize++;
                } else if ((this.activeSpellFlags & 0x4) === 4) {
                    this.menuOption[this.menuSize] = this.spellCaption + ' @cya@' + loc.name;
                    this.menuAction[this.menuSize] = MenuAction.OPLOCT;
                    this.menuParamA[this.menuSize] = typecode;
                    this.menuParamB[this.menuSize] = x;
                    this.menuParamC[this.menuSize] = z;
                    this.menuSize++;
                }
            } else if (entityType === 1) {
                const npc: ClientNpc | null = this.npc[typeId];

                if (npc && npc.type && npc.type.size === 1 && (npc.x & 0x7f) === 64 && (npc.z & 0x7f) === 64) {
                    for (let i: number = 0; i < this.npcCount; i++) {
                        const other: ClientNpc | null = this.npc[this.npcIds[i]];

                        if (other && other !== npc && other.type && other.type.size === 1 && other.x === npc.x && other.z === npc.z) {
                            this.addNpcOptions(other.type, this.npcIds[i], x, z);
                        }
                    }
                }

                if (npc && npc.type) {
                    this.addNpcOptions(npc.type, typeId, x, z);
                }
            } else if (entityType === 0) {
                const player: ClientPlayer | null = this.players[typeId];

                if (player && (player.x & 0x7f) === 64 && (player.z & 0x7f) === 64) {
                    for (let i: number = 0; i < this.npcCount; i++) {
                        const other: ClientNpc | null = this.npc[this.npcIds[i]];

                        if (other && other.type && other.type.size === 1 && other.x === player.x && other.z === player.z) {
                            this.addNpcOptions(other.type, this.npcIds[i], x, z);
                        }
                    }

                    for (let i: number = 0; i < this.playerCount; i++) {
                        const other: ClientPlayer | null = this.players[this.playerIds[i]];

                        if (other && other !== player && other.x === player.x && other.z === player.z) {
                            this.addPlayerOptions(other, this.playerIds[i], x, z);
                        }
                    }
                }

                if (player) {
                    this.addPlayerOptions(player, typeId, x, z);
                }
            } else if (entityType === 3) {
                const objs = this.objStacks[this.minusedlevel][x][z];
                if (!objs) {
                    continue;
                }

                for (let obj = objs.tail(); obj !== null; obj = objs.prev()) {
                    const type: ObjType = ObjType.get(obj.id);
                    if (this.objSelected === 1) {
                        this.menuOption[this.menuSize] = 'Use ' + this.objSelectedName + ' with @lre@' + type.name;
                        this.menuAction[this.menuSize] = MenuAction.OPOBJU;
                        this.menuParamA[this.menuSize] = obj.id;
                        this.menuParamB[this.menuSize] = x;
                        this.menuParamC[this.menuSize] = z;
                        this.menuSize++;
                    } else if (this.spellSelected !== 1) {
                        for (let op: number = 4; op >= 0; op--) {
                            if (type.op && type.op[op]) {
                                this.menuOption[this.menuSize] = type.op[op] + ' @lre@' + type.name;

                                if (op === 0) {
                                    this.menuAction[this.menuSize] = MenuAction.OPOBJ1;
                                } else if (op === 1) {
                                    this.menuAction[this.menuSize] = MenuAction.OPOBJ2;
                                } else if (op === 2) {
                                    this.menuAction[this.menuSize] = MenuAction.OPOBJ3;
                                } else if (op === 3) {
                                    this.menuAction[this.menuSize] = MenuAction.OPOBJ4;
                                } else if (op === 4) {
                                    this.menuAction[this.menuSize] = MenuAction.OPOBJ5;
                                }

                                this.menuParamA[this.menuSize] = obj.id;
                                this.menuParamB[this.menuSize] = x;
                                this.menuParamC[this.menuSize] = z;
                                this.menuSize++;
                            } else if (op === 2) {
                                this.menuOption[this.menuSize] = 'Take @lre@' + type.name;
                                this.menuAction[this.menuSize] = MenuAction.OPOBJ3;
                                this.menuParamA[this.menuSize] = obj.id;
                                this.menuParamB[this.menuSize] = x;
                                this.menuParamC[this.menuSize] = z;
                                this.menuSize++;
                            }
                        }

                        this.menuOption[this.menuSize] = 'Examine @lre@' + type.name;
                        this.menuAction[this.menuSize] = MenuAction.OPOBJ6;
                        this.menuParamA[this.menuSize] = obj.id;
                        this.menuParamB[this.menuSize] = x;
                        this.menuParamC[this.menuSize] = z;
                        this.menuSize++;
                    } else if ((this.activeSpellFlags & 0x1) === 1) {
                        this.menuOption[this.menuSize] = this.spellCaption + ' @lre@' + type.name;
                        this.menuAction[this.menuSize] = MenuAction.OPOBJT;
                        this.menuParamA[this.menuSize] = obj.id;
                        this.menuParamB[this.menuSize] = x;
                        this.menuParamC[this.menuSize] = z;
                        this.menuSize++;
                    }
                }
            }
        }
    }

    private handleMouseInput(): void {
        if (this.objDragArea !== 0) {
            return;
        }

        if (this.isMobile && this.dialogInputOpen && this.insideChatPopupArea()) {
            return;
        }

        let button: number = this.mouseClickButton;
        if (this.spellSelected === 1 && this.mouseClickX >= 516 && this.mouseClickY >= 160 && this.mouseClickX <= 765 && this.mouseClickY <= 205) {
            button = 0;
        }

        if (!this.menuVisible) {
            if (button === 1 && this.menuSize > 0) {
                const action: number = this.menuAction[this.menuSize - 1];

                if (
                    action == MenuAction.INV_BUTTON1 || action == MenuAction.INV_BUTTON2 || action == MenuAction.INV_BUTTON3 || action == MenuAction.INV_BUTTON4 || action == MenuAction.INV_BUTTON5 ||
                    action == MenuAction.OPHELD1 || action == MenuAction.OPHELD2 || action == MenuAction.OPHELD3 || action == MenuAction.OPHELD4 || action == MenuAction.OPHELD5 ||
                    action == MenuAction.OPHELDT_START || action === MenuAction.OPHELD6
                ) {
                    const slot: number = this.menuParamB[this.menuSize - 1];
                    const comId: number = this.menuParamC[this.menuSize - 1];
                    const com: IfType = IfType.list[comId];

                    if (com.draggable || com.swappable) {
                        this.objGrabThreshold = false;
                        this.objDragCycles = 0;
                        this.objDragLayerId = comId;
                        this.objDragSlot = slot;
                        this.objDragArea = 2;
                        this.objGrabX = this.mouseClickX;
                        this.objGrabY = this.mouseClickY;

                        if (IfType.list[comId].layerId === this.mainLayerId) {
                            this.objDragArea = 1;
                        }

                        if (IfType.list[comId].layerId === this.chatLayerId) {
                            this.objDragArea = 3;
                        }

                        return;
                    }
                }
            }

            if (button === 1 && (this.oneMouseButton === 1 || this.isAddFriendOption(this.menuSize - 1)) && this.menuSize > 2) {
                button = 2;
            }

            if (button === 1 && this.menuSize > 0) {
                this.useMenuOption(this.menuSize - 1);
            } else if (button == 2 && this.menuSize > 0) {
                this.showContextMenu();
            }

            return;
        }

        if (button === 1) {
            const menuX: number = this.menuX;
            const menuY: number = this.menuY;
            const menuWidth: number = this.menuWidth;

            let clickX: number = this.mouseClickX;
            let clickY: number = this.mouseClickY;

            if (this.menuArea === 0) {
                clickX -= 4;
                clickY -= 4;
            } else if (this.menuArea === 1) {
                clickX -= 553;
                clickY -= 205;
            } else if (this.menuArea === 2) {
                clickX -= 17;
                clickY -= 357;
            }

            let option: number = -1;
            for (let i: number = 0; i < this.menuSize; i++) {
                const optionY: number = menuY + (this.menuSize - 1 - i) * 15 + 31;
                if (clickX > menuX && clickX < menuX + menuWidth && clickY > optionY - 13 && clickY < optionY + 3) {
                    option = i;
                }
            }

            if (option !== -1) {
                this.useMenuOption(option);
            }

            this.menuVisible = false;

            if (this.menuArea === 1) {
                this.redrawSidebar = true;
            } else if (this.menuArea === 2) {
                this.redrawChatback = true;
            }
        } else {
            let x: number = this.mouseX;
            let y: number = this.mouseY;

            if (this.menuArea === 0) {
                x -= 4;
                y -= 4;
            } else if (this.menuArea === 1) {
                x -= 553;
                y -= 205;
            } else if (this.menuArea === 2) {
                x -= 17;
                y -= 357;
            }

            if (x < this.menuX - 10 || x > this.menuX + this.menuWidth + 10 || y < this.menuY - 10 || y > this.menuY + this.menuHeight + 10) {
                this.menuVisible = false;

                if (this.menuArea === 1) {
                    this.redrawSidebar = true;
                }

                if (this.menuArea === 2) {
                    this.redrawChatback = true;
                }
            }
        }
    }

    handleMinimapInput(): void {
        if (this.mouseClickButton !== 1 || !this.localPlayer) {
            return;
        }

        let x: number = this.mouseClickX - 25 - 550;
        let y: number = this.mouseClickY - 4 - 4;

        if (x < 0 || y < 0 || x >= 146 || y >= 151) {
            return;
        }

        x -= 73;
        y -= 75;

        const yaw: number = (this.orbitCameraYaw + this.macroMinimapAngle) & 0x7ff;
        let sinYaw: number = Pix3D.sinTable[yaw];
        let cosYaw: number = Pix3D.cosTable[yaw];

        sinYaw = (sinYaw * (this.macroMinimapZoom + 256)) >> 8;
        cosYaw = (cosYaw * (this.macroMinimapZoom + 256)) >> 8;

        const relX: number = (y * sinYaw + x * cosYaw) >> 11;
        const relY: number = (y * cosYaw - x * sinYaw) >> 11;

        const tileX: number = (this.localPlayer.x + relX) >> 7;
        const tileZ: number = (this.localPlayer.z - relY) >> 7;

        if (this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], tileX, tileZ, 1, 0, 0, 0, 0, 0, true)) {
            // the additional 14-bytes in MOVE_MINIMAPCLICK
            this.out.p1(x);
            this.out.p1(y);
            this.out.p2(this.orbitCameraYaw);
            this.out.p1(57);
            this.out.p1(this.macroMinimapAngle);
            this.out.p1(this.macroMinimapZoom);
            this.out.p1(89);
            this.out.p2(this.localPlayer.x);
            this.out.p2(this.localPlayer.z);
            this.out.p1(this.tryMoveNearest);
            this.out.p1(63);
        }
    }

    private handleTabInput(): void {
        if (this.mouseClickButton !== 1) {
            return;
        }

        if (this.mouseClickX >= 539 && this.mouseClickX <= 573 && this.mouseClickY >= 169 && this.mouseClickY < 205 && this.sideTabLayerId[0] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 0;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 569 && this.mouseClickX <= 599 && this.mouseClickY >= 168 && this.mouseClickY < 205 && this.sideTabLayerId[1] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 1;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 597 && this.mouseClickX <= 627 && this.mouseClickY >= 168 && this.mouseClickY < 205 && this.sideTabLayerId[2] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 2;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 625 && this.mouseClickX <= 669 && this.mouseClickY >= 168 && this.mouseClickY < 203 && this.sideTabLayerId[3] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 3;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 666 && this.mouseClickX <= 696 && this.mouseClickY >= 168 && this.mouseClickY < 205 && this.sideTabLayerId[4] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 4;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 694 && this.mouseClickX <= 724 && this.mouseClickY >= 168 && this.mouseClickY < 205 && this.sideTabLayerId[5] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 5;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 722 && this.mouseClickX <= 756 && this.mouseClickY >= 169 && this.mouseClickY < 205 && this.sideTabLayerId[6] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 6;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 540 && this.mouseClickX <= 574 && this.mouseClickY >= 466 && this.mouseClickY < 502 && this.sideTabLayerId[7] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 7;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 572 && this.mouseClickX <= 602 && this.mouseClickY >= 466 && this.mouseClickY < 503 && this.sideTabLayerId[8] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 8;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 599 && this.mouseClickX <= 629 && this.mouseClickY >= 466 && this.mouseClickY < 503 && this.sideTabLayerId[9] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 9;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 627 && this.mouseClickX <= 671 && this.mouseClickY >= 467 && this.mouseClickY < 502 && this.sideTabLayerId[10] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 10;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 669 && this.mouseClickX <= 699 && this.mouseClickY >= 466 && this.mouseClickY < 503 && this.sideTabLayerId[11] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 11;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 696 && this.mouseClickX <= 726 && this.mouseClickY >= 466 && this.mouseClickY < 503 && this.sideTabLayerId[12] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 12;
            this.redrawSideicons = true;
        } else if (this.mouseClickX >= 724 && this.mouseClickX <= 758 && this.mouseClickY >= 466 && this.mouseClickY < 502 && this.sideTabLayerId[13] != -1) {
            this.redrawSidebar = true;
            this.sideTab = 13;
            this.redrawSideicons = true;
        }
    }

    private handleChatModeInput(): void {
        if (this.mouseClickButton !== 1) {
            return;
        }

        if (this.mouseClickX >= 6 && this.mouseClickX <= 106 && this.mouseClickY >= 467 && this.mouseClickY <= 499) {
            this.chatPublicMode = (this.chatPublicMode + 1) % 4;
            this.redrawPrivacySettings = true;
            this.redrawChatback = true;

            this.out.pIsaac(ClientProt.CHAT_SETMODE);
            this.out.p1(this.chatPublicMode);
            this.out.p1(this.chatPrivateMode);
            this.out.p1(this.chatTradeMode);
        } else if (this.mouseClickX >= 135 && this.mouseClickX <= 235 && this.mouseClickY >= 467 && this.mouseClickY <= 499) {
            this.chatPrivateMode = (this.chatPrivateMode + 1) % 3;
            this.redrawPrivacySettings = true;
            this.redrawChatback = true;

            this.out.pIsaac(ClientProt.CHAT_SETMODE);
            this.out.p1(this.chatPublicMode);
            this.out.p1(this.chatPrivateMode);
            this.out.p1(this.chatTradeMode);
        } else if (this.mouseClickX >= 273 && this.mouseClickX <= 373 && this.mouseClickY >= 467 && this.mouseClickY <= 499) {
            this.chatTradeMode = (this.chatTradeMode + 1) % 3;
            this.redrawPrivacySettings = true;
            this.redrawChatback = true;

            this.out.pIsaac(ClientProt.CHAT_SETMODE);
            this.out.p1(this.chatPublicMode);
            this.out.p1(this.chatPrivateMode);
            this.out.p1(this.chatTradeMode);
        } else if (this.mouseClickX >= 412 && this.mouseClickX <= 512 && this.mouseClickY >= 467 && this.mouseClickY <= 499) {
            this.closeModal();

            this.reportAbuseInput = '';
            this.reportAbuseMuteOption = false;

            for (let i: number = 0; i < IfType.list.length; i++) {
                if (IfType.list[i] && IfType.list[i].clientCode === ClientCode.CC_REPORT_INPUT) {
                    this.reportAbuseLayerId = this.mainLayerId = IfType.list[i].layerId;
                    break;
                }
            }

            if (this.isMobile) {
                MobileKeyboard.show();
            }
        }
    }

    // jag::oldscape::Client::CloseModal
    private closeModal(): void {
        this.out.pIsaac(ClientProt.CLOSE_MODAL);

        if (this.sideLayerId !== -1) {
            this.sideLayerId = -1;
            this.redrawSidebar = true;
            this.resumedPauseButton = false;
            this.redrawSideicons = true;
        }

        if (this.chatLayerId !== -1) {
            this.chatLayerId = -1;
            this.redrawChatback = true;
            this.resumedPauseButton = false;
        }

        this.mainLayerId = -1;
    }

    // jag::oldscape::Client::GlTimeoutChat
    private timeoutChat(): void {
        for (let i: number = -1; i < this.playerCount; i++) {
            let index: number;
            if (i === -1) {
                index = Constants.LOCAL_PLAYER_INDEX;
            } else {
                index = this.playerIds[i];
            }

            const player: ClientPlayer | null = this.players[index];
            if (player && player.chatTimer > 0) {
                player.chatTimer--;

                if (player.chatTimer === 0) {
                    player.chatMessage = null;
                }
            }
        }

        for (let i: number = 0; i < this.npcCount; i++) {
            const index: number = this.npcIds[i];
            const npc: ClientNpc | null = this.npc[index];

            if (npc && npc.chatTimer > 0) {
                npc.chatTimer--;

                if (npc.chatTimer === 0) {
                    npc.chatMessage = null;
                }
            }
        }
    }

    // jag::oldscape::Client::GlFollowCamera
    private followCamera(): void {
        if (!this.localPlayer) {
            return; // custom
        }

        const orbitX: number = this.localPlayer.x + this.macroCameraX;
        const orbitZ: number = this.localPlayer.z + this.macroCameraZ;

        if (this.orbitCameraX - orbitX < -500 || this.orbitCameraX - orbitX > 500 || this.orbitCameraZ - orbitZ < -500 || this.orbitCameraZ - orbitZ > 500) {
            this.orbitCameraX = orbitX;
            this.orbitCameraZ = orbitZ;
        }

        if (this.orbitCameraX !== orbitX) {
            this.orbitCameraX += ((orbitX - this.orbitCameraX) / 16) | 0;
        }

        if (this.orbitCameraZ !== orbitZ) {
            this.orbitCameraZ += ((orbitZ - this.orbitCameraZ) / 16) | 0;
        }

        if (this.keyHeld[1] === 1) {
            this.orbitCameraYawVelocity += ((-this.orbitCameraYawVelocity - 24) / 2) | 0;
        } else if (this.keyHeld[2] === 1) {
            this.orbitCameraYawVelocity += ((24 - this.orbitCameraYawVelocity) / 2) | 0;
        } else {
            this.orbitCameraYawVelocity = (this.orbitCameraYawVelocity / 2) | 0;
        }

        if (this.keyHeld[3] === 1) {
            this.orbitCameraPitchVelocity += ((12 - this.orbitCameraPitchVelocity) / 2) | 0;
        } else if (this.keyHeld[4] === 1) {
            this.orbitCameraPitchVelocity += ((-this.orbitCameraPitchVelocity - 12) / 2) | 0;
        } else {
            this.orbitCameraPitchVelocity = (this.orbitCameraPitchVelocity / 2) | 0;
        }

        this.orbitCameraYaw = ((this.orbitCameraYaw + this.orbitCameraYawVelocity / 2) | 0) & 0x7ff;
        this.orbitCameraPitch += (this.orbitCameraPitchVelocity / 2) | 0;

        if (this.orbitCameraPitch < 128) {
            this.orbitCameraPitch = 128;
        } else if (this.orbitCameraPitch > 383) {
            this.orbitCameraPitch = 383;
        }

        const orbitTileX: number = this.orbitCameraX >> 7;
        const orbitTileZ: number = this.orbitCameraZ >> 7;
        const orbitY: number = this.getAvH(this.minusedlevel, this.orbitCameraX, this.orbitCameraZ);
        let maxY: number = 0;

        if (this.groundh) {
            if (orbitTileX > 3 && orbitTileZ > 3 && orbitTileX < 100 && orbitTileZ < 100) {
                for (let x: number = orbitTileX - 4; x <= orbitTileX + 4; x++) {
                    for (let z: number = orbitTileZ - 4; z <= orbitTileZ + 4; z++) {
                        let level: number = this.minusedlevel;
                        if (level < 3 && this.mapl && (this.mapl[1][x][z] & MapFlag.VisBelow) !== 0) {
                            level++;
                        }

                        const y: number = orbitY - this.groundh[level][x][z];
                        if (y > maxY) {
                            maxY = y;
                        }
                    }
                }
            }
        }

        let clamp: number = maxY * 192;
        if (clamp > 98048) {
            clamp = 98048;
        } else if (clamp < 32768) {
            clamp = 32768;
        }

        if (clamp > this.cameraPitchClamp) {
            this.cameraPitchClamp += ((clamp - this.cameraPitchClamp) / 24) | 0;
        } else if (clamp < this.cameraPitchClamp) {
            this.cameraPitchClamp += ((clamp - this.cameraPitchClamp) / 80) | 0;
        }
    }

    // jag::oldscape::Client::GlCinemaCamera
    private cinemaCamera(): void {
        let x: number = this.camMoveToLx * 128 + 64;
        let z: number = this.camMoveToLz * 128 + 64;
        let y: number = this.getAvH(this.minusedlevel, x, z) - this.camMoveToHei;

        if (this.camX < x) {
            this.camX += this.camMoveToRate + ((((x - this.camX) * this.camMoveToRate2) / 1000) | 0);
            if (this.camX > x) {
                this.camX = x;
            }
        }

        if (this.camX > x) {
            this.camX -= this.camMoveToRate + ((((this.camX - x) * this.camMoveToRate2) / 1000) | 0);
            if (this.camX < x) {
                this.camX = x;
            }
        }

        if (this.camY < y) {
            this.camY += this.camMoveToRate + ((((y - this.camY) * this.camMoveToRate2) / 1000) | 0);
            if (this.camY > y) {
                this.camY = y;
            }
        }

        if (this.camY > y) {
            this.camY -= this.camMoveToRate + ((((this.camY - y) * this.camMoveToRate2) / 1000) | 0);
            if (this.camY < y) {
                this.camY = y;
            }
        }

        if (this.camZ < z) {
            this.camZ += this.camMoveToRate + ((((z - this.camZ) * this.camMoveToRate2) / 1000) | 0);
            if (this.camZ > z) {
                this.camZ = z;
            }
        }

        if (this.camZ > z) {
            this.camZ -= this.camMoveToRate + ((((this.camZ - z) * this.camMoveToRate2) / 1000) | 0);
            if (this.camZ < z) {
                this.camZ = z;
            }
        }

        x = this.camLookAtLx * 128 + 64;
        z = this.camLookAtLz * 128 + 64;
        y = this.getAvH(this.minusedlevel, x, z) - this.camLookAtHei;

        const dx: number = x - this.camX;
        const dy: number = y - this.camY;
        const dz: number = z - this.camZ;

        const distance: number = Math.sqrt(dx * dx + dz * dz) | 0;
        let pitch: number = ((Math.atan2(dy, distance) * 325.949) | 0) & 0x7ff;
        const yaw: number = ((Math.atan2(dx, dz) * -325.949) | 0) & 0x7ff;

        if (pitch < 128) {
            pitch = 128;
        } else if (pitch > 383) {
            pitch = 383;
        }

        if (this.camPitch < pitch) {
            this.camPitch += this.camLookAtRate + ((((pitch - this.camPitch) * this.camLookAtRate2) / 1000) | 0);
            if (this.camPitch > pitch) {
                this.camPitch = pitch;
            }
        }

        if (this.camPitch > pitch) {
            this.camPitch -= this.camLookAtRate + ((((this.camPitch - pitch) * this.camLookAtRate2) / 1000) | 0);
            if (this.camPitch < pitch) {
                this.camPitch = pitch;
            }
        }

        let deltaYaw: number = yaw - this.camYaw;
        if (deltaYaw > 1024) {
            deltaYaw -= 2048;
        } else if (deltaYaw < -1024) {
            deltaYaw += 2048;
        }

        if (deltaYaw > 0) {
            this.camYaw += this.camLookAtRate + (((deltaYaw * this.camLookAtRate2) / 1000) | 0);
            this.camYaw &= 0x7ff;
        }

        if (deltaYaw < 0) {
            this.camYaw -= this.camLookAtRate + (((-deltaYaw * this.camLookAtRate2) / 1000) | 0);
            this.camYaw &= 0x7ff;
        }

        let tmp: number = yaw - this.camYaw;
        if (tmp > 1024) {
            tmp -= 2048;
        } else if (tmp < -1024) {
            tmp += 2048;
        }

        if ((tmp < 0 && deltaYaw > 0) || (tmp > 0 && deltaYaw < 0)) {
            this.camYaw = yaw;
        }
    }

    private async handleInputKey(): Promise<void> {
        Client.cyclelogic4++;
        if (Client.cyclelogic4 > 192) {
            Client.cyclelogic4 = 0;

            this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC4);
            this.out.p1(232);
        }

        while (true) {
            let key: number;
            do {
                while (true) {
                    key = this.pollKey();
                    if (key === -1) {
                        return;
                    }

                    if (this.mainLayerId !== -1 && this.mainLayerId === this.reportAbuseLayerId) {
                        if (key === 8 && this.reportAbuseInput.length > 0) {
                            this.reportAbuseInput = this.reportAbuseInput.substring(0, this.reportAbuseInput.length - 1);
                        }
                        break;
                    }

                    if (this.socialInputOpen) {
                        if (key >= 32 && key <= 122 && this.socialInput.length < 80) {
                            this.socialInput = this.socialInput + String.fromCharCode(key);
                            this.redrawChatback = true;
                        }

                        if (key === 8 && this.socialInput.length > 0) {
                            this.socialInput = this.socialInput.substring(0, this.socialInput.length - 1);
                            this.redrawChatback = true;
                        }

                        if (key === 13 || key === 10) {
                            this.socialInputOpen = false;
                            this.redrawChatback = true;

                            let username: bigint;
                            if (this.socialInputType === 1) {
                                username = JString.toBase37(this.socialInput);
                                this.addFriend(username);
                            }

                            if (this.socialInputType === 2 && this.friendCount > 0) {
                                username = JString.toBase37(this.socialInput);
                                this.delFriend(username);
                            }

                            if (this.socialInputType === 3 && this.socialInput.length > 0 && this.socialName37) {
                                this.out.pIsaac(ClientProt.MESSAGE_PRIVATE);
                                this.out.p1(0);
                                const start: number = this.out.pos;

                                this.out.p8(this.socialName37);
                                WordPack.pack(this.out, this.socialInput);
                                this.out.psize1(this.out.pos - start);

                                this.socialInput = JString.toSentenceCase(this.socialInput);
                                this.socialInput = WordFilter.filter(this.socialInput);
                                this.addChat(6, this.socialInput, JString.formatName(JString.fromBase37(this.socialName37)));

                                if (this.chatPrivateMode === 2) {
                                    this.chatPrivateMode = 1;
                                    this.redrawPrivacySettings = true;

                                    this.out.pIsaac(ClientProt.CHAT_SETMODE);
                                    this.out.p1(this.chatPublicMode);
                                    this.out.p1(this.chatPrivateMode);
                                    this.out.p1(this.chatTradeMode);
                                }
                            }

                            if (this.socialInputType === 4 && this.ignoreCount < 100) {
                                username = JString.toBase37(this.socialInput);
                                this.addIgnore(username);
                            }

                            if (this.socialInputType === 5 && this.ignoreCount > 0) {
                                username = JString.toBase37(this.socialInput);
                                this.delIgnore(username);
                            }
                        }
                    } else if (this.dialogInputOpen) {
                        if (key >= 48 && key <= 57 && this.chatbackInput.length < 10) {
                            this.chatbackInput = this.chatbackInput + String.fromCharCode(key);
                            this.redrawChatback = true;
                        }

                        if (key === 8 && this.chatbackInput.length > 0) {
                            this.chatbackInput = this.chatbackInput.substring(0, this.chatbackInput.length - 1);
                            this.redrawChatback = true;
                        }

                        if (key === 13 || key === 10) {
                            if (this.chatbackInput.length > 0) {
                                let value: number = 0;
                                try {
                                    value = parseInt(this.chatbackInput, 10);
                                } catch (_e) {
                                    // empty
                                }

                                this.out.pIsaac(ClientProt.RESUME_P_COUNTDIALOG);
                                this.out.p4(value);
                            }

                            this.dialogInputOpen = false;
                            this.redrawChatback = true;
                        }
                    } else if (this.chatLayerId === -1) {
                        // custom: when typing a command, you can use the debugproc character (tilde)
                        if (key >= 32 && (key <= 122 || (this.chatTyped.startsWith('::') && key <= 126)) && this.chatTyped.length < 80) {
                            this.chatTyped = this.chatTyped + String.fromCharCode(key);
                            this.redrawChatback = true;
                        }

                        if (key === 8 && this.chatTyped.length > 0) {
                            this.chatTyped = this.chatTyped.substring(0, this.chatTyped.length - 1);
                            this.redrawChatback = true;
                        }

                        if ((key === 13 || key === 10) && this.chatTyped.length > 0) {
                            if (this.staffmodlevel === 2) {
                                if (this.chatTyped === '::clientdrop') {
                                    await this.tryReconnect();
                                } else if (this.chatTyped === '::prefetchmusic') {
                                    if (this.onDemand) {
                                        for (let i = 0; i < this.onDemand.getFileCount(2); i++) {
                                            this.onDemand.prefetchPriority(2, i, 1);
                                        }
                                    }
                                } else if (this.chatTyped === '::lag') {
                                    this.lag();
                                }
                            }

                            // custom: player-facing commands
                            if (this.chatTyped === '::fpson') {
                                // authentic in later revs
                                this.displayFps = true;
                            } else if (this.chatTyped === '::fpsoff') {
                                // authentic in later revs
                                this.displayFps = false;
                            } else if (this.chatTyped.startsWith('::fps ')) {
                                // custom ::fps command for setting a target framerate
                                try {
                                    const desiredFps = parseInt(this.chatTyped.substring(6)) || 50;
                                    this.setTargetedFramerate(desiredFps);
                                } catch (_e) {
                                    // empty
                                }
                            } else if (this.chatTyped.startsWith('::')) {
                                this.out.pIsaac(ClientProt.CLIENT_CHEAT);
                                this.out.p1(this.chatTyped.length - 2 + 1);
                                this.out.pjstr(this.chatTyped.substring(2));
                            } else {
                                let colour: number = 0;
                                if (this.chatTyped.startsWith('yellow:')) {
                                    colour = 0;
                                    this.chatTyped = this.chatTyped.substring(7);
                                } else if (this.chatTyped.startsWith('red:')) {
                                    colour = 1;
                                    this.chatTyped = this.chatTyped.substring(4);
                                } else if (this.chatTyped.startsWith('green:')) {
                                    colour = 2;
                                    this.chatTyped = this.chatTyped.substring(6);
                                } else if (this.chatTyped.startsWith('cyan:')) {
                                    colour = 3;
                                    this.chatTyped = this.chatTyped.substring(5);
                                } else if (this.chatTyped.startsWith('purple:')) {
                                    colour = 4;
                                    this.chatTyped = this.chatTyped.substring(7);
                                } else if (this.chatTyped.startsWith('white:')) {
                                    colour = 5;
                                    this.chatTyped = this.chatTyped.substring(6);
                                } else if (this.chatTyped.startsWith('flash1:')) {
                                    colour = 6;
                                    this.chatTyped = this.chatTyped.substring(7);
                                } else if (this.chatTyped.startsWith('flash2:')) {
                                    colour = 7;
                                    this.chatTyped = this.chatTyped.substring(7);
                                } else if (this.chatTyped.startsWith('flash3:')) {
                                    colour = 8;
                                    this.chatTyped = this.chatTyped.substring(7);
                                } else if (this.chatTyped.startsWith('glow1:')) {
                                    colour = 9;
                                    this.chatTyped = this.chatTyped.substring(6);
                                } else if (this.chatTyped.startsWith('glow2:')) {
                                    colour = 10;
                                    this.chatTyped = this.chatTyped.substring(6);
                                } else if (this.chatTyped.startsWith('glow3:')) {
                                    colour = 11;
                                    this.chatTyped = this.chatTyped.substring(6);
                                }

                                let effect: number = 0;
                                if (this.chatTyped.startsWith('wave:')) {
                                    effect = 1;
                                    this.chatTyped = this.chatTyped.substring(5);
                                }
                                if (this.chatTyped.startsWith('scroll:')) {
                                    effect = 2;
                                    this.chatTyped = this.chatTyped.substring(7);
                                }

                                this.out.pIsaac(ClientProt.MESSAGE_PUBLIC);
                                this.out.p1(0);
                                const start: number = this.out.pos;

                                this.out.p1(colour);
                                this.out.p1(effect);
                                WordPack.pack(this.out, this.chatTyped);
                                this.out.psize1(this.out.pos - start);

                                this.chatTyped = JString.toSentenceCase(this.chatTyped);
                                this.chatTyped = WordFilter.filter(this.chatTyped);

                                if (this.localPlayer && this.localPlayer.name) {
                                    this.localPlayer.chatMessage = this.chatTyped;
                                    this.localPlayer.chatColour = colour;
                                    this.localPlayer.chatEffect = effect;
                                    this.localPlayer.chatTimer = 150;

                                    if (this.staffmodlevel === 2) {
                                        this.addChat(2, this.localPlayer.chatMessage, '@cr2@' + this.localPlayer.name);
                                    } else if (this.staffmodlevel === 1) {
                                        this.addChat(2, this.localPlayer.chatMessage, '@cr1@' + this.localPlayer.name);
                                    } else {
                                        this.addChat(2, this.localPlayer.chatMessage, this.localPlayer.name);
                                    }
                                }

                                if (this.chatPublicMode === 2) {
                                    this.chatPublicMode = 3;
                                    this.redrawPrivacySettings = true;

                                    this.out.pIsaac(ClientProt.CHAT_SETMODE);
                                    this.out.p1(this.chatPublicMode);
                                    this.out.p1(this.chatPrivateMode);
                                    this.out.p1(this.chatTradeMode);
                                }
                            }

                            this.chatTyped = '';
                            this.redrawChatback = true;
                        }
                    }
                }
            } while ((key < 97 || key > 122) && (key < 65 || key > 90) && (key < 48 || key > 57) && key !== 32);

            if (this.reportAbuseInput.length < 12) {
                this.reportAbuseInput = this.reportAbuseInput + String.fromCharCode(key);
            }
        }
    }

    private lag() {
        console.log('============');
        console.log(`flame-cycle:${this.flameCycle0}`);
        if (this.onDemand) {
            console.log(`od-cycle:${this.onDemand.cycle}`);
        }
        console.log(`loop-cycle:${this.loopCycle}`);
        console.log(`draw-cycle:${this.drawCycle}`);
        console.log(`ptype:${this.ptype}`);
        console.log(`psize:${this.psize}`);
        // this.stream?.debug();
        this.debug = true;
    }

    // jag::oldscape::Client::GlMovePlayers
    private movePlayers(): void {
        for (let i: number = -1; i < this.playerCount; i++) {
            let index: number;
            if (i === -1) {
                index = Constants.LOCAL_PLAYER_INDEX;
            } else {
                index = this.playerIds[i];
            }

            const player: ClientPlayer | null = this.players[index];
            if (player) {
                this.moveEntity(player);
            }
        }
    }

    // jag::oldscape::Client::GlMoveNpcs
    private moveNpcs(): void {
        for (let i: number = 0; i < this.npcCount; i++) {
            const id: number = this.npcIds[i];
            const npc: ClientNpc | null = this.npc[id];

            if (npc && npc.type) {
                this.moveEntity(npc);
            }
        }
    }

    // jag::oldscape::Client::GlMoveEntity
    private moveEntity(e: ClientEntity): void {
        if (e.x < 128 || e.z < 128 || e.x >= 13184 || e.z >= 13184) {
            e.primaryAnim = -1;
            e.spotanimId = -1;
            e.exactMoveEnd = 0;
            e.exactMoveStart = 0;
            e.x = e.routeX[0] * 128 + e.size * 64;
            e.z = e.routeZ[0] * 128 + e.size * 64;
            e.abortRoute();
        }

        if (e === this.localPlayer && (e.x < 1536 || e.z < 1536 || e.x >= 11776 || e.z >= 11776)) {
            e.primaryAnim = -1;
            e.spotanimId = -1;
            e.exactMoveEnd = 0;
            e.exactMoveStart = 0;
            e.x = e.routeX[0] * 128 + e.size * 64;
            e.z = e.routeZ[0] * 128 + e.size * 64;
            e.abortRoute();
        }

        if (e.exactMoveEnd > this.loopCycle) {
            this.exactMove1(e);
        } else if (e.exactMoveStart >= this.loopCycle) {
            this.exactMove2(e);
        } else {
            this.routeMove(e);
        }

        this.entityFace(e);
        this.entityAnim(e);
    }

    // jag::oldscape::Client::GlExactMove1
    private exactMove1(e: ClientEntity): void {
        const delta: number = e.exactMoveEnd - this.loopCycle;
        const dstX: number = e.exactStartX * 128 + e.size * 64;
        const dstZ: number = e.exactStartZ * 128 + e.size * 64;

        e.x += ((dstX - e.x) / delta) | 0;
        e.z += ((dstZ - e.z) / delta) | 0;

        e.animDelayMove = 0;

        if (e.exactMoveFacing === 0) {
            e.dstYaw = 1024;
        } else if (e.exactMoveFacing === 1) {
            e.dstYaw = 1536;
        } else if (e.exactMoveFacing === 2) {
            e.dstYaw = 0;
        } else if (e.exactMoveFacing === 3) {
            e.dstYaw = 512;
        }
    }

    // jag::oldscape::Client::GlExactMove2
    private exactMove2(e: ClientEntity): void {
        if (e.exactMoveStart === this.loopCycle || e.primaryAnim === -1 || e.primaryAnimDelay !== 0 || e.primaryAnimCycle + 1 > SeqType.list[e.primaryAnim].getDuration(e.primaryAnimFrame)) {
            const duration: number = e.exactMoveStart - e.exactMoveEnd;
            const delta: number = this.loopCycle - e.exactMoveEnd;
            const dx0: number = e.exactStartX * 128 + e.size * 64;
            const dz0: number = e.exactStartZ * 128 + e.size * 64;
            const dx1: number = e.exactEndX * 128 + e.size * 64;
            const dz1: number = e.exactEndZ * 128 + e.size * 64;
            e.x = ((dx0 * (duration - delta) + dx1 * delta) / duration) | 0;
            e.z = ((dz0 * (duration - delta) + dz1 * delta) / duration) | 0;
        }

        e.animDelayMove = 0;

        if (e.exactMoveFacing === 0) {
            e.dstYaw = 1024;
        } else if (e.exactMoveFacing === 1) {
            e.dstYaw = 1536;
        } else if (e.exactMoveFacing === 2) {
            e.dstYaw = 0;
        } else if (e.exactMoveFacing === 3) {
            e.dstYaw = 512;
        }

        e.yaw = e.dstYaw;
    }

    // jag::oldscape::Client::GlRouteMove
    private routeMove(e: ClientEntity): void {
        e.secondaryAnim = e.readyanim;

        if (e.routeLength === 0) {
            e.animDelayMove = 0;
            return;
        }

        if (e.primaryAnim !== -1 && e.primaryAnimDelay === 0) {
            const seq: SeqType = SeqType.list[e.primaryAnim];
            if (e.preanimRouteLength > 0 && seq.preanim_move === PreanimMove.DELAYMOVE) {
                e.animDelayMove++;
                return;
            }

            if (e.preanimRouteLength <= 0 && seq.postanim_move === PostanimMove.DELAYMOVE) {
                e.animDelayMove++;
                return;
            }
        }

        const x: number = e.x;
        const z: number = e.z;
        const dstX: number = e.routeX[e.routeLength - 1] * 128 + e.size * 64;
        const dstZ: number = e.routeZ[e.routeLength - 1] * 128 + e.size * 64;

        if (dstX - x > 256 || dstX - x < -256 || dstZ - z > 256 || dstZ - z < -256) {
            e.x = dstX;
            e.z = dstZ;
            return;
        }

        if (x < dstX) {
            if (z < dstZ) {
                e.dstYaw = 1280;
            } else if (z > dstZ) {
                e.dstYaw = 1792;
            } else {
                e.dstYaw = 1536;
            }
        } else if (x > dstX) {
            if (z < dstZ) {
                e.dstYaw = 768;
            } else if (z > dstZ) {
                e.dstYaw = 256;
            } else {
                e.dstYaw = 512;
            }
        } else if (z < dstZ) {
            e.dstYaw = 1024;
        } else {
            e.dstYaw = 0;
        }

        let deltaYaw: number = (e.dstYaw - e.yaw) & 0x7ff;
        if (deltaYaw > 1024) {
            deltaYaw -= 2048;
        }

        let seqId: number = e.walkanim_b;
        if (deltaYaw >= -256 && deltaYaw <= 256) {
            seqId = e.walkanim;
        } else if (deltaYaw >= 256 && deltaYaw < 768) {
            seqId = e.walkanim_r;
        } else if (deltaYaw >= -768 && deltaYaw <= -256) {
            seqId = e.walkanim_l;
        }

        if (seqId === -1) {
            seqId = e.walkanim;
        }

        e.secondaryAnim = seqId;

        let moveSpeed: number = 4;
        if (e.yaw !== e.dstYaw && e.faceEntity === -1 && e.turnspeed !== 0) {
            moveSpeed = 2;
        }
        if (e.routeLength > 2) {
            moveSpeed = 6;
        }
        if (e.routeLength > 3) {
            moveSpeed = 8;
        }
        if (e.animDelayMove > 0 && e.routeLength > 1) {
            moveSpeed = 8;
            e.animDelayMove--;
        }
        if (e.routeRun[e.routeLength - 1]) {
            moveSpeed <<= 0x1;
        }

        if (moveSpeed >= 8 && e.secondaryAnim === e.walkanim && e.runanim !== -1) {
            e.secondaryAnim = e.runanim;
        }

        if (x < dstX) {
            e.x += moveSpeed;
            if (e.x > dstX) {
                e.x = dstX;
            }
        } else if (x > dstX) {
            e.x -= moveSpeed;
            if (e.x < dstX) {
                e.x = dstX;
            }
        }
        if (z < dstZ) {
            e.z += moveSpeed;
            if (e.z > dstZ) {
                e.z = dstZ;
            }
        } else if (z > dstZ) {
            e.z -= moveSpeed;
            if (e.z < dstZ) {
                e.z = dstZ;
            }
        }

        if (e.x === dstX && e.z === dstZ) {
            e.routeLength--;
            if (e.preanimRouteLength > 0) {
                e.preanimRouteLength--;
            }
        }
    }

    // jag::oldscape::Client::GlEntityFace
    private entityFace(e: ClientEntity): void {
        if (e.turnspeed === 0) {
            return;
        }

        if (e.faceEntity !== -1 && e.faceEntity < 32768) {
            const npc: ClientNpc | null = this.npc[e.faceEntity];
            if (npc) {
                const dstX: number = e.x - npc.x;
                const dstZ: number = e.z - npc.z;

                if (dstX !== 0 || dstZ !== 0) {
                    e.dstYaw = ((Math.atan2(dstX, dstZ) * 325.949) | 0) & 0x7ff;
                }
            }
        }

        if (e.faceEntity >= 32768) {
            let index: number = e.faceEntity - 32768;
            if (index === this.localPid) {
                index = Constants.LOCAL_PLAYER_INDEX;
            }

            const player: ClientPlayer | null = this.players[index];
            if (player) {
                const dstX: number = e.x - player.x;
                const dstZ: number = e.z - player.z;

                if (dstX !== 0 || dstZ !== 0) {
                    e.dstYaw = ((Math.atan2(dstX, dstZ) * 325.949) | 0) & 0x7ff;
                }
            }
        }

        if ((e.faceSquareX !== 0 || e.faceSquareZ !== 0) && (e.routeLength === 0 || e.animDelayMove > 0)) {
            const dstX: number = e.x - (e.faceSquareX - this.mapBuildBaseX - this.mapBuildBaseX) * 64;
            const dstZ: number = e.z - (e.faceSquareZ - this.mapBuildBaseZ - this.mapBuildBaseZ) * 64;

            if (dstX !== 0 || dstZ !== 0) {
                e.dstYaw = ((Math.atan2(dstX, dstZ) * 325.949) | 0) & 0x7ff;
            }

            e.faceSquareX = 0;
            e.faceSquareZ = 0;
        }

        const remainingYaw: number = (e.dstYaw - e.yaw) & 0x7ff;
        if (remainingYaw !== 0) {
            if (remainingYaw < e.turnspeed || remainingYaw > 2048 - e.turnspeed) {
                e.yaw = e.dstYaw;
            } else if (remainingYaw > 1024) {
                e.yaw -= e.turnspeed;
            } else {
                e.yaw += e.turnspeed;
            }

            e.yaw &= 0x7ff;

            if (e.secondaryAnim === e.readyanim && e.yaw !== e.dstYaw) {
                if (e.turnanim != -1) {
                    e.secondaryAnim = e.turnanim;
                } else {
                    e.secondaryAnim = e.walkanim;
                }
            }
        }
    }

    // jag::oldscape::Client::GlEntityAnim
    private entityAnim(e: ClientEntity): void {
        e.needsForwardDrawPadding = false;

        let seq: SeqType | null;
        if (e.secondaryAnim !== -1) {
            seq = SeqType.list[e.secondaryAnim];
            e.secondaryAnimCycle++;

            if (e.secondaryAnimFrame < seq.numFrames && e.secondaryAnimCycle > seq.getDuration(e.secondaryAnimFrame)) {
                e.secondaryAnimCycle = 0;
                e.secondaryAnimFrame++;
            }

            if (e.secondaryAnimFrame >= seq.numFrames) {
                e.secondaryAnimCycle = 0;
                e.secondaryAnimFrame = 0;
            }
        }

        if (e.spotanimId !== -1 && this.loopCycle >= e.spotanimLastCycle) {
            if (e.spotanimFrame < 0) {
                e.spotanimFrame = 0;
            }

            seq = SpotAnimType.list[e.spotanimId].seq;
            e.spotanimCycle++;

            while (seq && e.spotanimFrame < seq.numFrames && e.spotanimCycle > seq.getDuration(e.spotanimFrame)) {
                e.spotanimCycle -= seq.getDuration(e.spotanimFrame);
                e.spotanimFrame++;
            }

            if (seq && e.spotanimFrame >= seq.numFrames) {
                if (e.spotanimFrame < 0 || e.spotanimFrame >= seq.numFrames) {
                    e.spotanimId = -1;
                }
            }
        }

        if (e.primaryAnim != -1 && e.primaryAnimDelay <= 1) {
            seq = SeqType.list[e.primaryAnim];
            if (seq.preanim_move === PreanimMove.DELAYANIM && e.preanimRouteLength > 0 && this.loopCycle >= e.exactMoveStart && this.loopCycle > e.exactMoveEnd) {
                e.primaryAnimDelay = 1;
                return;
            }
        }

        if (e.primaryAnim !== -1 && e.primaryAnimDelay === 0) {
            seq = SeqType.list[e.primaryAnim];
            e.primaryAnimCycle++;

            while (e.primaryAnimFrame < seq.numFrames && e.primaryAnimCycle > seq.getDuration(e.primaryAnimFrame)) {
                e.primaryAnimCycle -= seq.getDuration(e.primaryAnimFrame);
                e.primaryAnimFrame++;
            }

            if (e.primaryAnimFrame >= seq.numFrames) {
                e.primaryAnimFrame -= seq.loops;
                e.primaryAnimLoop++;

                if (e.primaryAnimLoop >= seq.maxloops) {
                    e.primaryAnim = -1;
                }

                if (e.primaryAnimFrame < 0 || e.primaryAnimFrame >= seq.numFrames) {
                    e.primaryAnim = -1;
                }
            }

            e.needsForwardDrawPadding = seq.stretches;
        }

        if (e.primaryAnimDelay > 0) {
            e.primaryAnimDelay--;
        }
    }

    private async loadTitle(): Promise<void> {
        if (this.imageTitle2) {
            return;
        }

        this.drawArea = null;
        this.areaChatback = null;
        this.areaMapback = null;
        this.areaSidebar = null;
        this.areaViewport = null;
        this.areaBackbase1 = null;
        this.areaBackbase2 = null;
        this.areaBackhmid1 = null;

        this.imageTitle0 = new PixMap(128, 265);
        Pix2D.cls();

        this.imageTitle1 = new PixMap(128, 265);
        Pix2D.cls();

        this.imageTitle2 = new PixMap(509, 171);
        Pix2D.cls();

        this.imageTitle3 = new PixMap(360, 132);
        Pix2D.cls();

        this.imageTitle4 = new PixMap(360, 200);
        Pix2D.cls();

        this.imageTitle5 = new PixMap(202, 238);
        Pix2D.cls();

        this.imageTitle6 = new PixMap(203, 238);
        Pix2D.cls();

        this.imageTitle7 = new PixMap(74, 94);
        Pix2D.cls();

        this.imageTitle8 = new PixMap(75, 94);
        Pix2D.cls();

        if (this.jagTitle) {
            await this.loadTitleBackground();
            this.loadTitleImages();
        }

        this.redrawFrame = true;
    }

    private async loadTitleBackground(): Promise<void> {
        if (!this.jagTitle) {
            return;
        }

        const background: Pix32 = await Pix32.loadJpeg(this.jagTitle, 'title');

        this.imageTitle0?.bind();
        background.quickPlotSprite(0, 0);

        this.imageTitle1?.bind();
        background.quickPlotSprite(-637, 0);

        this.imageTitle2?.bind();
        background.quickPlotSprite(-128, 0);

        this.imageTitle3?.bind();
        background.quickPlotSprite(-202, -371);

        this.imageTitle4?.bind();
        background.quickPlotSprite(-202, -171);

        this.imageTitle5?.bind();
        background.quickPlotSprite(0, -265);

        this.imageTitle6?.bind();
        background.quickPlotSprite(-562, -265);

        this.imageTitle7?.bind();
        background.quickPlotSprite(-128, -171);

        this.imageTitle8?.bind();
        background.quickPlotSprite(-562, -171);

        // draw right side (mirror image)
        background.hflip();

        this.imageTitle0?.bind();
        background.quickPlotSprite(382, 0);

        this.imageTitle1?.bind();
        background.quickPlotSprite(-255, 0);

        this.imageTitle2?.bind();
        background.quickPlotSprite(254, 0);

        this.imageTitle3?.bind();
        background.quickPlotSprite(180, -371);

        this.imageTitle4?.bind();
        background.quickPlotSprite(180, -171);

        this.imageTitle5?.bind();
        background.quickPlotSprite(382, -265);

        this.imageTitle6?.bind();
        background.quickPlotSprite(-180, -265);

        this.imageTitle7?.bind();
        background.quickPlotSprite(254, -171);

        this.imageTitle8?.bind();
        background.quickPlotSprite(-180, -171);

        const logo: Pix32 = Pix32.load(this.jagTitle, 'logo');
        this.imageTitle2?.bind();
        logo.plotSprite(((this.sWid / 2) | 0) - ((logo.wi / 2) | 0) - 128, 18);
    }

    private loadTitleImages(): void {
        if (!this.jagTitle) {
            return;
        }

        this.imageTitlebox = Pix8.load(this.jagTitle, 'titlebox');
        this.imageTitlebutton = Pix8.load(this.jagTitle, 'titlebutton');
        for (let i: number = 0; i < 12; i++) {
            this.imageRunes[i] = Pix8.load(this.jagTitle, 'runes', i);
        }
        this.imageFlamesLeft = new Pix32(128, 265);
        this.imageFlamesRight = new Pix32(128, 265);

        if (this.imageTitle0) arraycopy(this.imageTitle0.data, 0, this.imageFlamesLeft.data, 0, 33920);
        if (this.imageTitle1) arraycopy(this.imageTitle1.data, 0, this.imageFlamesRight.data, 0, 33920);

        this.flameGradient0 = new Int32Array(256);
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index] = index * 262144;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 64] = index * 1024 + Colour.RED;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 128] = index * 4 + Colour.YELLOW;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient0[index + 192] = Colour.WHITE;
        }

        this.flameGradient1 = new Int32Array(256);
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index] = index * 1024;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 64] = index * 4 + Colour.GREEN;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 128] = index * 262144 + Colour.CYAN;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient1[index + 192] = Colour.WHITE;
        }

        this.flameGradient2 = new Int32Array(256);
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index] = index * 4;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 64] = index * 262144 + Colour.BLUE;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 128] = index * 1024 + Colour.MAGENTA;
        }
        for (let index: number = 0; index < 64; index++) {
            this.flameGradient2[index + 192] = Colour.WHITE;
        }

        this.flameGradient = new Int32Array(256);
        this.flameBuffer0 = new Int32Array(32768);
        this.flameBuffer1 = new Int32Array(32768);
        this.generateFlameCoolingMap(null);
        this.flameBuffer3 = new Int32Array(32768);
        this.flameBuffer2 = new Int32Array(32768);

        this.drawProgress(10, 'Connecting to fileserver').then((): void => {
            if (!this.flameActive) {
                this.flameActive = true;
                this.flamesInterval = setInterval(this.renderFlames.bind(this), 35);
            }
        });
    }

    // jag::oldscape::TitleScreen::Draw
    private async titleScreenDraw(): Promise<void> {
        await this.loadTitle();
        this.imageTitle4?.bind();
        this.imageTitlebox?.plotSprite(0, 0);

        const w: number = 360;
        const h: number = 200;

        if (this.loginscreen === 0) {
            const extraY: number = ((h / 2) | 0) + 80;
            let y: number = ((h / 2) | 0) - 20;

            if (this.onDemand) {
                this.fontPlain11?.centreStringTag(w / 2, extraY, this.onDemand.message, 0x75a9a9, true);
            }

            this.fontBold12?.centreStringTag(w / 2, y, 'Welcome to RuneScape', Colour.YELLOW, true);
            y += 30;

            let x = ((w / 2) | 0) - 80;
            y = ((h / 2) | 0) + 20;
            this.imageTitlebutton?.plotSprite(x - 73, y - 20);
            this.fontBold12?.centreStringTag(x, y + 5, 'New user', Colour.WHITE, true);

            x = ((w / 2) | 0) + 80;
            this.imageTitlebutton?.plotSprite(x - 73, y - 20);
            this.fontBold12?.centreStringTag(x, y + 5, 'Existing User', Colour.WHITE, true);
        } else if (this.loginscreen === 2) {
            let x: number = ((w / 2) | 0) - 80;
            let y: number = ((h / 2) | 0) - 40;
            if (this.loginMes1.length > 0) {
                this.fontBold12?.centreStringTag(w / 2, y - 15, this.loginMes1, Colour.YELLOW, true);
                this.fontBold12?.centreStringTag(w / 2, y, this.loginMes2, Colour.YELLOW, true);
                y += 30;
            } else {
                this.fontBold12?.centreStringTag(w / 2, y - 7, this.loginMes2, Colour.YELLOW, true);
                y += 30;
            }

            this.fontBold12?.drawStringTag(w / 2 - 90, y, `Username: ${this.loginUser}${this.loginSelect === 0 && this.loopCycle % 40 < 20 ? '@yel@|' : ''}`, Colour.WHITE, true);
            y += 15;

            this.fontBold12?.drawStringTag(w / 2 - 88, y, `Password: ${JString.toAsterisks(this.loginPass)}${this.loginSelect === 1 && this.loopCycle % 40 < 20 ? '@yel@|' : ''}`, Colour.WHITE, true);
            y += 15;

            x = ((w / 2) | 0) - 80;
            y = ((h / 2) | 0) + 50;
            this.imageTitlebutton?.plotSprite(x - 73, y - 20);
            this.fontBold12?.centreStringTag(x, y + 5, 'Login', Colour.WHITE, true);

            x = ((w / 2) | 0) + 80;
            this.imageTitlebutton?.plotSprite(x - 73, y - 20);
            this.fontBold12?.centreStringTag(x, y + 5, 'Cancel', Colour.WHITE, true);
        } else if (this.loginscreen === 3) {
            let x: number = (w / 2) | 0;
            let y: number = ((h / 2) | 0) - 60;
            this.fontBold12?.centreStringTag(x, y, 'Create a free account', Colour.YELLOW, true);

            y = ((h / 2) | 0) - 35;
            this.fontBold12?.centreStringTag(x, y, 'To create a new account you need to', Colour.WHITE, true);
            y += 15;

            this.fontBold12?.centreStringTag(x, y, 'go back to the main RuneScape webpage', Colour.WHITE, true);
            y += 15;

            this.fontBold12?.centreStringTag(x, y, "and choose the red 'create account'", Colour.WHITE, true);
            y += 15;

            this.fontBold12?.centreStringTag(x, y, 'button at the top right of that page.', Colour.WHITE, true);
            y += 15;

            x = (w / 2) | 0;
            y = ((h / 2) | 0) + 50;
            this.imageTitlebutton?.plotSprite(x - 73, y - 20);
            this.fontBold12?.centreStringTag(x, y + 5, 'Cancel', Colour.WHITE, true);
        }

        this.imageTitle4?.draw(202, 171);

        if (this.redrawFrame) {
            this.redrawFrame = false;
            this.imageTitle2?.draw(128, 0);
            this.imageTitle3?.draw(202, 371);
            this.imageTitle5?.draw(0, 265);
            this.imageTitle6?.draw(562, 265);
            this.imageTitle7?.draw(128, 171);
            this.imageTitle8?.draw(562, 171);
        }
    }

    // jag::oldscape::Client::GameDraw
    private gameDraw(): void {
        if (this.players === null) {
            // client is unloading asynchronously
            return;
        }

        if (this.redrawFrame) {
            this.redrawFrame = false;

            this.areaBackleft1?.draw(0, 4);
            this.areaBackleft2?.draw(0, 357);
            this.areaBackright1?.draw(722, 4);
            this.areaBackright2?.draw(743, 205);
            this.areaBacktop1?.draw(0, 0);
            this.areaBackvmid1?.draw(516, 4);
            this.areaBackvmid2?.draw(516, 205);
            this.areaBackvmid3?.draw(496, 357);
            this.areaBackhmid2?.draw(0, 338);

            this.redrawSidebar = true;
            this.redrawChatback = true;
            this.redrawSideicons = true;
            this.redrawPrivacySettings = true;

            if (this.sceneState !== 2) {
                this.areaViewport?.draw(4, 4);
                this.areaMapback?.draw(550, 4);
            }
        }

        if (this.sceneState === 2) {
            this.gameDrawMain();
        }

        if (this.menuVisible && this.menuArea === 1) {
            this.redrawSidebar = true;
        }

        if (this.sideLayerId !== -1) {
            const redraw = this.animateLayer(this.sideLayerId, this.sceneDelta);
            if (redraw) {
                this.redrawSidebar = true;
            }
        }

        if (this.selectedArea === 2) {
            this.redrawSidebar = true;
        }

        if (this.objDragArea === 2) {
            this.redrawSidebar = true;
        }

        if (this.redrawSidebar) {
            this.drawSidebar();
            this.redrawSidebar = false;
        }

        if (this.chatLayerId === -1) {
            this.chatInterface.scrollPos = this.chatScrollHeight - this.chatScrollOffset - 77;

            if (this.mouseX > 448 && this.mouseX < 560 && this.mouseY > 332) {
                this.doScrollbar(this.mouseX - 17, this.mouseY - 357, this.chatScrollHeight, 77, false, 463, 0, this.chatInterface);
            }

            let offset: number = this.chatScrollHeight - this.chatInterface.scrollPos - 77;
            if (offset < 0) {
                offset = 0;
            }

            if (offset > this.chatScrollHeight - 77) {
                offset = this.chatScrollHeight - 77;
            }

            if (this.chatScrollOffset !== offset) {
                this.chatScrollOffset = offset;
                this.redrawChatback = true;
            }
        }

        if (this.chatLayerId !== -1) {
            const redraw = this.animateLayer(this.chatLayerId, this.sceneDelta);
            if (redraw) {
                this.redrawChatback = true;
            }
        }

        if (this.selectedArea === 3) {
            this.redrawChatback = true;
        }

        if (this.objDragArea === 3) {
            this.redrawChatback = true;
        }

        if (this.modalMessage) {
            this.redrawChatback = true;
        }

        if (this.menuVisible && this.menuArea === 2) {
            this.redrawChatback = true;
        }

        if (this.redrawChatback) {
            this.drawChat();
            this.redrawChatback = false;
        }

        if (this.sceneState === 2) {
            this.drawMinimap();
            this.areaMapback?.draw(550, 4);
        }

        if (this.flashingTab !== -1) {
            this.redrawSideicons = true;
        }

        if (this.redrawSideicons) {
            if (this.flashingTab !== -1 && this.flashingTab === this.sideTab) {
                this.flashingTab = -1;
                this.out.pIsaac(ClientProt.TUT_CLICKSIDE);
                this.out.p1(this.sideTab);
            }

            this.redrawSideicons = false;
            this.areaBackhmid1?.bind();
            this.backhmid1?.plotSprite(0, 0);

            if (this.sideLayerId === -1) {
                if (this.sideTabLayerId[this.sideTab] !== -1) {
                    if (this.sideTab === 0) {
                        this.redstone1?.plotSprite(22, 10);
                    } else if (this.sideTab === 1) {
                        this.redstone2?.plotSprite(54, 8);
                    } else if (this.sideTab === 2) {
                        this.redstone2?.plotSprite(82, 8);
                    } else if (this.sideTab === 3) {
                        this.redstone3?.plotSprite(110, 8);
                    } else if (this.sideTab === 4) {
                        this.redstone2h?.plotSprite(153, 8);
                    } else if (this.sideTab === 5) {
                        this.redstone2h?.plotSprite(181, 8);
                    } else if (this.sideTab === 6) {
                        this.redstone1h?.plotSprite(209, 9);
                    }
                }

                if (this.sideTabLayerId[0] !== -1 && (this.flashingTab !== 0 || this.loopCycle % 20 < 10)) {
                    this.sideicons[0]?.plotSprite(29, 13);
                }

                if (this.sideTabLayerId[1] !== -1 && (this.flashingTab !== 1 || this.loopCycle % 20 < 10)) {
                    this.sideicons[1]?.plotSprite(53, 11);
                }

                if (this.sideTabLayerId[2] !== -1 && (this.flashingTab !== 2 || this.loopCycle % 20 < 10)) {
                    this.sideicons[2]?.plotSprite(82, 11);
                }

                if (this.sideTabLayerId[3] !== -1 && (this.flashingTab !== 3 || this.loopCycle % 20 < 10)) {
                    this.sideicons[3]?.plotSprite(115, 12);
                }

                if (this.sideTabLayerId[4] !== -1 && (this.flashingTab !== 4 || this.loopCycle % 20 < 10)) {
                    this.sideicons[4]?.plotSprite(153, 13);
                }

                if (this.sideTabLayerId[5] !== -1 && (this.flashingTab !== 5 || this.loopCycle % 20 < 10)) {
                    this.sideicons[5]?.plotSprite(180, 11);
                }

                if (this.sideTabLayerId[6] !== -1 && (this.flashingTab !== 6 || this.loopCycle % 20 < 10)) {
                    this.sideicons[6]?.plotSprite(208, 13);
                }
            }

            this.areaBackhmid1?.draw(516, 160);

            this.areaBackbase2?.bind();
            this.backbase2?.plotSprite(0, 0);

            if (this.sideLayerId === -1) {
                if (this.sideTabLayerId[this.sideTab] !== -1) {
                    if (this.sideTab === 7) {
                        this.redstone1v?.plotSprite(42, 0);
                    } else if (this.sideTab === 8) {
                        this.redstone2v?.plotSprite(74, 0);
                    } else if (this.sideTab === 9) {
                        this.redstone2v?.plotSprite(102, 0);
                    } else if (this.sideTab === 10) {
                        this.redstone3v?.plotSprite(130, 1);
                    } else if (this.sideTab === 11) {
                        this.redstone2hv?.plotSprite(173, 0);
                    } else if (this.sideTab === 12) {
                        this.redstone2hv?.plotSprite(201, 0);
                    } else if (this.sideTab === 13) {
                        this.redstone1hv?.plotSprite(229, 0);
                    }
                }

                if (this.sideTabLayerId[8] !== -1 && (this.flashingTab !== 8 || this.loopCycle % 20 < 10)) {
                    this.sideicons[7]?.plotSprite(74, 2);
                }

                if (this.sideTabLayerId[9] !== -1 && (this.flashingTab !== 9 || this.loopCycle % 20 < 10)) {
                    this.sideicons[8]?.plotSprite(102, 3);
                }

                if (this.sideTabLayerId[10] !== -1 && (this.flashingTab !== 10 || this.loopCycle % 20 < 10)) {
                    this.sideicons[9]?.plotSprite(137, 4);
                }

                if (this.sideTabLayerId[11] !== -1 && (this.flashingTab !== 11 || this.loopCycle % 20 < 10)) {
                    this.sideicons[10]?.plotSprite(174, 2);
                }

                if (this.sideTabLayerId[12] !== -1 && (this.flashingTab !== 12 || this.loopCycle % 20 < 10)) {
                    this.sideicons[11]?.plotSprite(201, 2);
                }

                if (this.sideTabLayerId[13] !== -1 && (this.flashingTab !== 13 || this.loopCycle % 20 < 10)) {
                    this.sideicons[12]?.plotSprite(226, 2);
                }
            }

            this.areaBackbase2?.draw(496, 466);

            this.areaViewport?.bind();
        }

        if (this.redrawPrivacySettings) {
            this.redrawPrivacySettings = false;

            this.areaBackbase1?.bind();
            this.backbase1?.plotSprite(0, 0);

            this.fontPlain12?.centreStringTag(55, 28, 'Public chat', Colour.WHITE, true);
            if (this.chatPublicMode === 0) {
                this.fontPlain12?.centreStringTag(55, 41, 'On', Colour.GREEN, true);
            }
            if (this.chatPublicMode === 1) {
                this.fontPlain12?.centreStringTag(55, 41, 'Friends', Colour.YELLOW, true);
            }
            if (this.chatPublicMode === 2) {
                this.fontPlain12?.centreStringTag(55, 41, 'Off', Colour.RED, true);
            }
            if (this.chatPublicMode === 3) {
                this.fontPlain12?.centreStringTag(55, 41, 'Hide', Colour.CYAN, true);
            }

            this.fontPlain12?.centreStringTag(184, 28, 'Private chat', Colour.WHITE, true);
            if (this.chatPrivateMode === 0) {
                this.fontPlain12?.centreStringTag(184, 41, 'On', Colour.GREEN, true);
            }
            if (this.chatPrivateMode === 1) {
                this.fontPlain12?.centreStringTag(184, 41, 'Friends', Colour.YELLOW, true);
            }
            if (this.chatPrivateMode === 2) {
                this.fontPlain12?.centreStringTag(184, 41, 'Off', Colour.RED, true);
            }

            this.fontPlain12?.centreStringTag(324, 28, 'Trade/duel', Colour.WHITE, true);
            if (this.chatTradeMode === 0) {
                this.fontPlain12?.centreStringTag(324, 41, 'On', Colour.GREEN, true);
            }
            if (this.chatTradeMode === 1) {
                this.fontPlain12?.centreStringTag(324, 41, 'Friends', Colour.YELLOW, true);
            }
            if (this.chatTradeMode === 2) {
                this.fontPlain12?.centreStringTag(324, 41, 'Off', Colour.RED, true);
            }

            this.fontPlain12?.centreStringTag(458, 33, 'Report abuse', Colour.WHITE, true);

            this.areaBackbase1?.draw(0, 453);

            this.areaViewport?.bind();
        }

        this.sceneDelta = 0;
    }

    // jag::oldscape::Client::GameDrawMain
    private gameDrawMain(): void {
        this.sceneCycle++;

        this.addPlayers(true);
        this.addNpcs(true);
        this.addPlayers(false);
        this.addNpcs(false);
        this.addProjectiles();
        this.addMapAnim();

        if (!this.cinemaCam) {
            let pitch: number = this.orbitCameraPitch;
            if (((this.cameraPitchClamp / 256) | 0) > pitch) {
                pitch = (this.cameraPitchClamp / 256) | 0;
            }
            if (this.camShake[4] && this.camShakeRan[4] + 128 > pitch) {
                pitch = this.camShakeRan[4] + 128;
            }

            const yaw: number = (this.orbitCameraYaw + this.macroCameraAngle) & 0x7ff;

            if (this.localPlayer) {
                this.camFollow(this.orbitCameraX, this.getAvH(this.minusedlevel, this.localPlayer.x, this.localPlayer.z) - 50, this.orbitCameraZ, yaw, pitch, pitch * 3 + 600);
            }
        }

        let level: number;
        if (this.cinemaCam) {
            level = this.roofCheck2();
        } else {
            level = this.roofCheck();
        }

        const camX: number = this.camX;
        const camY: number = this.camY;
        const camZ: number = this.camZ;
        const camPitch: number = this.camPitch;
        const camYaw: number = this.camYaw;

        for (let axis: number = 0; axis < 5; axis++) {
            if (!this.camShake[axis]) {
                continue;
            }

            const jitter = (Math.random() * (this.camShakeAxis[axis] * 2 + 1) - this.camShakeAxis[axis] + Math.sin(this.camShakeCycle[axis] * (this.camShakeAmp[axis] / 100.0)) * this.camShakeRan[axis]) | 0;
            if (axis === 0) {
                this.camX += jitter;
            } else if (axis === 1) {
                this.camY += jitter;
            } else if (axis === 2) {
                this.camZ += jitter;
            } else if (axis === 3) {
                this.camYaw = (this.camYaw + jitter) & 0x7ff;
            } else if (axis === 4) {
                this.camPitch += jitter;

                if (this.camPitch < 128) {
                    this.camPitch = 128;
                }

                if (this.camPitch > 383) {
                    this.camPitch = 383;
                }
            }
        }

        const cycle = Pix3D.cycle;
        Model.checkHover = true;
        Model.pickedCount = 0;
        Model.mouseX = this.mouseX - 4;
        Model.mouseY = this.mouseY - 4;

        Pix2D.cls();
        this.world?.renderAll(this.camX, this.camY, this.camZ, level, this.camYaw, this.camPitch, this.loopCycle);
        this.world?.removeSprites();
        this.entityOverlays();
        this.coordArrow();
        this.textureRunAnims(cycle);
        this.otherOverlays();
        this.areaViewport?.draw(4, 4);

        this.camX = camX;
        this.camY = camY;
        this.camZ = camZ;
        this.camPitch = camPitch;
        this.camYaw = camYaw;
    }

    // jag::oldscape::Client::GdmAddPlayerToWorld
    private addPlayers(self: boolean): void {
        if (!this.localPlayer) {
            return;
        }

        if (this.localPlayer.x >> 7 === this.minimapFlagX && this.localPlayer.z >> 7 === this.minimapFlagZ) {
            this.minimapFlagX = 0;

            Client.cyclelogic6++;
            if (Client.cyclelogic6 > 122) {
                Client.cyclelogic6 = 0;

                this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC6);
                this.out.p1(62);
            }
        }

        let count = this.playerCount;
        if (self) {
            count = 1;
        }

        for (let i: number = 0; i < count; i++) {
            let player: ClientPlayer | null;
            let id: number;
            if (self) {
                player = this.localPlayer;
                id = Constants.LOCAL_PLAYER_INDEX << 14;
            } else {
                player = this.players[this.playerIds[i]];
                id = this.playerIds[i] << 14;
            }

            if (!player || !player.isReady()) {
                continue;
            }

            player.lowMemory = false;
            if ((Client.lowMem && this.playerCount > 50 || this.playerCount > 200) && !self && player.secondaryAnim == player.readyanim) {
                player.lowMemory = true;
            }

            const stx: number = player.x >> 7;
            const stz: number = player.z >> 7;

            if (stx < 0 || stx >= CollisionConstants.SIZE || stz < 0 || stz >= CollisionConstants.SIZE) {
                continue;
            }

            if (!player.locModel || this.loopCycle < player.locStartCycle || this.loopCycle >= player.locStopCycle) {
                if ((player.x & 0x7f) === 64 && (player.z & 0x7f) === 64) {
                    if (this.tileLastOccupiedCycle[stx][stz] == this.sceneCycle && i != -1) {
                        continue;
                    }

                    this.tileLastOccupiedCycle[stx][stz] = this.sceneCycle;
                }

                player.y = this.getAvH(this.minusedlevel, player.x, player.z);
                this.world?.addDynamic(this.minusedlevel, player.x, player.y, player.z, player, id, player.yaw, 60, player.needsForwardDrawPadding);
            } else {
                player.lowMemory = false;
                player.y = this.getAvH(this.minusedlevel, player.x, player.z);
                this.world?.addDynamic2(this.minusedlevel, player.x, player.y, player.z, player.minTileX, player.minTileZ, player.maxTileX, player.maxTileZ, player, id, player.yaw);
            }
        }
    }

    // jag::oldscape::Client::GdmAddNPCs
    private addNpcs(alwaysontop: boolean): void {
        for (let i: number = 0; i < this.npcCount; i++) {
            const npc: ClientNpc | null = this.npc[this.npcIds[i]];
            const typecode: number = ((this.npcIds[i] << 14) + 0x20000000) | 0;

            if (!npc || !npc.isReady() || npc.type?.alwaysontop !== alwaysontop) {
                continue;
            }

            const x: number = npc.x >> 7;
            const z: number = npc.z >> 7;

            if (x < 0 || x >= CollisionConstants.SIZE || z < 0 || z >= CollisionConstants.SIZE) {
                continue;
            }

            if (npc.size === 1 && (npc.x & 0x7f) === 64 && (npc.z & 0x7f) === 64) {
                if (this.tileLastOccupiedCycle[x][z] === this.sceneCycle) {
                    continue;
                }

                this.tileLastOccupiedCycle[x][z] = this.sceneCycle;
            }

            this.world?.addDynamic(this.minusedlevel, npc.x, this.getAvH(this.minusedlevel, npc.x, npc.z), npc.z, npc, typecode, npc.yaw, (npc.size - 1) * 64 + 60, npc.needsForwardDrawPadding);
        }
    }

    // jag::oldscape::Client::GdmAddProjectiles
    private addProjectiles(): void {
        for (let proj = this.projectiles.head(); proj !== null; proj = this.projectiles.next()) {
            if (proj.level !== this.minusedlevel || this.loopCycle > proj.t2) {
                proj.unlink();
            } else if (this.loopCycle >= proj.t1) {
                if (proj.target > 0) {
                    const npc: ClientNpc | null = this.npc[proj.target - 1];
                    if (npc) {
                        proj.setTarget(npc.x, this.getAvH(proj.level, npc.x, npc.z) - proj.h2, npc.z, this.loopCycle);
                    }
                }

                if (proj.target < 0) {
                    const index: number = -proj.target - 1;
                    let player: ClientPlayer | null;
                    if (index === this.localPid) {
                        player = this.localPlayer;
                    } else {
                        player = this.players[index];
                    }

                    if (player) {
                        proj.setTarget(player.x, this.getAvH(proj.level, player.x, player.z) - proj.h2, player.z, this.loopCycle);
                    }
                }

                proj.move(this.sceneDelta);
                this.world?.addDynamic(this.minusedlevel, proj.x | 0, proj.y | 0, proj.z | 0, proj, -1, proj.yaw, 60, false);
            }
        }

        Client.cyclelogic1++;
        if (Client.cyclelogic1 > 1174) {
            Client.cyclelogic1 = 0;

            this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC1);
            this.out.p1(0);
            const start = this.out.pos;
            if (((Math.random() * 2.0) | 0) === 0) {
                this.out.p2(11499);
            }
            this.out.p2(10548);
            if (((Math.random() * 2.0) | 0) == 0) {
                this.out.p1(139);
            }
            if (((Math.random() * 2.0) | 0) == 0) {
                this.out.p1(94);
            }
            this.out.p2(51693);
            this.out.p1(16);
            this.out.p2(15036);
            if (((Math.random() * 2.0) | 0) == 0) {
                this.out.p1(65);
            }
            this.out.p1((Math.random() * 256.0) | 0);
            this.out.p2(22990);
            this.out.psize1(this.out.pos - start);
        }
    }

    // jag::oldscape::Client::GdmAddMapAnim
    private addMapAnim(): void {
        for (let spot = this.spotanims.head(); spot !== null; spot = this.spotanims.next()) {
            if (spot.level !== this.minusedlevel || spot.animComplete) {
                spot.unlink();
            } else if (this.loopCycle >= spot.startCycle) {
                spot.update(this.sceneDelta);

                if (spot.animComplete) {
                    spot.unlink();
                } else {
                    this.world?.addDynamic(spot.level, spot.x, spot.y, spot.z, spot, -1, 0, 60, false);
                }
            }
        }
    }

    // jag::oldscape::Client::CamFollow
    private camFollow(targetX: number, targetY: number, targetZ: number, yaw: number, pitch: number, distance: number): void {
        const invPitch: number = (2048 - pitch) & 0x7ff;
        const invYaw: number = (2048 - yaw) & 0x7ff;

        let x: number = 0;
        let y: number = 0;
        let z: number = distance;

        let sin: number;
        let cos: number;
        let tmp: number;

        if (invPitch !== 0) {
            sin = Pix3D.sinTable[invPitch];
            cos = Pix3D.cosTable[invPitch];
            tmp = (y * cos - distance * sin) >> 16;
            z = (y * sin + distance * cos) >> 16;
            y = tmp;
        }

        if (invYaw !== 0) {
            sin = Pix3D.sinTable[invYaw];
            cos = Pix3D.cosTable[invYaw];
            tmp = (z * sin + x * cos) >> 16;
            z = (z * cos - x * sin) >> 16;
            x = tmp;
        }

        this.camX = targetX - x;
        this.camY = targetY - y;
        this.camZ = targetZ - z;
        this.camPitch = pitch;
        this.camYaw = yaw;
    }

    // jag::oldscape::Client::GdmRoofCheck2
    private roofCheck2(): number {
        if (!this.mapl) {
            return 0; // custom
        }

        const y: number = this.getAvH(this.minusedlevel, this.camX, this.camZ);
        return y - this.camY >= 800 || (this.mapl[this.minusedlevel][this.camX >> 7][this.camZ >> 7] & MapFlag.RemoveRoof) === 0 ? 3 : this.minusedlevel;
    }

    // jag::oldscape::Client::GdmRoofCheck
    private roofCheck(): number {
        let top: number = 3;

        if (this.camPitch < 310 && this.localPlayer) {
            let cameraLocalTileX: number = this.camX >> 7;
            let cameraLocalTileZ: number = this.camZ >> 7;
            const playerLocalTileX: number = this.localPlayer.x >> 7;
            const playerLocalTileZ: number = this.localPlayer.z >> 7;

            if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & MapFlag.RemoveRoof) !== 0) {
                top = this.minusedlevel;
            }

            let tileDeltaX: number;
            if (playerLocalTileX > cameraLocalTileX) {
                tileDeltaX = playerLocalTileX - cameraLocalTileX;
            } else {
                tileDeltaX = cameraLocalTileX - playerLocalTileX;
            }

            let tileDeltaZ: number;
            if (playerLocalTileZ > cameraLocalTileZ) {
                tileDeltaZ = playerLocalTileZ - cameraLocalTileZ;
            } else {
                tileDeltaZ = cameraLocalTileZ - playerLocalTileZ;
            }

            if (tileDeltaX > tileDeltaZ) {
                const delta = ((tileDeltaZ * 65536) / tileDeltaX) | 0;
                let accumulator = 32768;

                while (cameraLocalTileX !== playerLocalTileX) {
                    if (cameraLocalTileX < playerLocalTileX) {
                        cameraLocalTileX++;
                    } else if (cameraLocalTileX > playerLocalTileX) {
                        cameraLocalTileX--;
                    }

                    if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & MapFlag.RemoveRoof) !== 0) {
                        top = this.minusedlevel;
                    }

                    accumulator += delta;
                    if (accumulator >= 65536) {
                        accumulator -= 65536;

                        if (cameraLocalTileZ < playerLocalTileZ) {
                            cameraLocalTileZ++;
                        } else if (cameraLocalTileZ > playerLocalTileZ) {
                            cameraLocalTileZ--;
                        }

                        if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & MapFlag.RemoveRoof) !== 0) {
                            top = this.minusedlevel;
                        }
                    }
                }
            } else {
                const delta = ((tileDeltaX * 65536) / tileDeltaZ) | 0;
                let accumulator = 32768;

                while (cameraLocalTileZ !== playerLocalTileZ) {
                    if (cameraLocalTileZ < playerLocalTileZ) {
                        cameraLocalTileZ++;
                    } else if (cameraLocalTileZ > playerLocalTileZ) {
                        cameraLocalTileZ--;
                    }

                    if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & MapFlag.RemoveRoof) !== 0) {
                        top = this.minusedlevel;
                    }

                    accumulator += delta;
                    if (accumulator >= 65536) {
                        accumulator -= 65536;

                        if (cameraLocalTileX < playerLocalTileX) {
                            cameraLocalTileX++;
                        } else if (cameraLocalTileX > playerLocalTileX) {
                            cameraLocalTileX--;
                        }

                        if (this.mapl && (this.mapl[this.minusedlevel][cameraLocalTileX][cameraLocalTileZ] & MapFlag.RemoveRoof) !== 0) {
                            top = this.minusedlevel;
                        }
                    }
                }
            }
        }

        if (this.localPlayer && this.mapl && (this.mapl[this.minusedlevel][this.localPlayer.x >> 7][this.localPlayer.z >> 7] & MapFlag.RemoveRoof) !== 0) {
            top = this.minusedlevel;
        }

        return top;
    }

    // jag::oldscape::Client::GdmEntityOverlays
    private entityOverlays(): void {
        this.chatCount = 0;

        for (let index: number = -1; index < this.playerCount + this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            if (index === -1) {
                entity = this.localPlayer;
            } else if (index < this.playerCount) {
                entity = this.players[this.playerIds[index]];
            } else {
                entity = this.npc[this.npcIds[index - this.playerCount]];
            }

            if (!entity || !entity.isReady()) {
                continue;
            }

            if (index >= this.playerCount) {
                const npc = (entity as ClientNpc).type;

                if (npc && npc.headicon >= 0 && npc.headicon < this.headicons.length) {
                    this.getOverlayPosEntity(entity, entity.height + 15);

                    if (this.projectX > -1) {
                        this.headicons[npc.headicon]?.plotSprite(this.projectX - 12, this.projectY - 30);
                    }
                }

                if (this.hintType === 1 && this.hintNpc === this.npcIds[index - this.playerCount] && this.loopCycle % 20 < 10) {
                    this.getOverlayPosEntity(entity, entity.height + 15);

                    if (this.projectX > -1) {
                        this.headicons[2]?.plotSprite(this.projectX - 12, this.projectY - 28);
                    }
                }
            } else {
                let y: number = 30;

                const player: ClientPlayer = entity as ClientPlayer;
                if (player.headicons !== 0) {
                    this.getOverlayPosEntity(entity, entity.height + 15);

                    if (this.projectX > -1) {
                        for (let icon: number = 0; icon < 8; icon++) {
                            if ((player.headicons & (0x1 << icon)) !== 0) {
                                this.headicons[icon]?.plotSprite(this.projectX - 12, this.projectY - y);
                                y -= 25;
                            }
                        }
                    }
                }

                if (index >= 0 && this.hintType === 10 && this.hintPlayer === this.playerIds[index]) {
                    this.getOverlayPosEntity(entity, entity.height + 15);

                    if (this.projectX > -1) {
                        this.headicons[7]?.plotSprite(this.projectX - 12, this.projectY - y);
                    }
                }
            }

            if (entity.chatMessage && (index >= this.playerCount || this.chatPublicMode === 0 || this.chatPublicMode === 3 || (this.chatPublicMode === 1 && this.isFriend((entity as ClientPlayer).name)))) {
                this.getOverlayPosEntity(entity, entity.height);

                if (this.projectX > -1 && this.chatCount < Constants.MAX_CHATS && this.fontBold12) {
                    this.chatWidth[this.chatCount] = (this.fontBold12.stringWid(entity.chatMessage) / 2) | 0;
                    this.chatHeight[this.chatCount] = this.fontBold12.height2d;
                    this.chatX[this.chatCount] = this.projectX;
                    this.chatY[this.chatCount] = this.projectY;

                    this.chatColour[this.chatCount] = entity.chatColour;
                    this.chatEffect[this.chatCount] = entity.chatEffect;
                    this.chatTimer[this.chatCount] = entity.chatTimer;
                    this.chats[this.chatCount++] = entity.chatMessage as string;

                    if (this.chatEffects === 0 && entity.chatEffect === 1) {
                        this.chatHeight[this.chatCount] += 10;
                        this.chatY[this.chatCount] += 5;
                    }

                    if (this.chatEffects === 0 && entity.chatEffect === 2) {
                        this.chatWidth[this.chatCount] = 60;
                    }
                }
            }

            if (entity.combatCycle > this.loopCycle + 100) {
                this.getOverlayPosEntity(entity, entity.height + 15);

                if (this.projectX > -1) {
                    let w: number = ((entity.health * 30) / entity.totalHealth) | 0;
                    if (w > 30) {
                        w = 30;
                    }
                    Pix2D.fillRect(this.projectX - 15, this.projectY - 3, w, 5, Colour.GREEN);
                    Pix2D.fillRect(this.projectX - 15 + w, this.projectY - 3, 30 - w, 5, Colour.RED);
                }
            }

            for (let i = 0; i < 4; ++i) {
                if (entity.damageCycles[i] <= this.loopCycle) {
                    continue;
                }

                this.getOverlayPosEntity(entity, (entity.height / 2) | 0);

                if (this.projectX <= -1) {
                    continue;
                }

                if (i == 1) {
                    this.projectY -= 20;
                } else if (i == 2) {
                    this.projectX -= 15;
                    this.projectY -= 10;
                } else if (i == 3) {
                    this.projectX += 15;
                    this.projectY -= 10;
                }

                this.hitmarks[entity.damageTypes[i]]?.plotSprite(this.projectX - 12, this.projectY - 12);
                this.fontPlain11?.centreString(this.projectX, this.projectY + 4, entity.damageValues[i].toString(), Colour.BLACK);
                this.fontPlain11?.centreString(this.projectX - 1, this.projectY + 3, entity.damageValues[i].toString(), Colour.WHITE);
            }
        }

        for (let i: number = 0; i < this.chatCount; i++) {
            const x: number = this.chatX[i];
            let y: number = this.chatY[i];
            const padding: number = this.chatWidth[i];
            const height: number = this.chatHeight[i];

            let sorting: boolean = true;
            while (sorting) {
                sorting = false;
                for (let j: number = 0; j < i; j++) {
                    if (y + 2 > this.chatY[j] - this.chatHeight[j] && y - height < this.chatY[j] + 2 && x - padding < this.chatX[j] + this.chatWidth[j] && x + padding > this.chatX[j] - this.chatWidth[j] && this.chatY[j] - this.chatHeight[j] < y) {
                        y = this.chatY[j] - this.chatHeight[j];
                        sorting = true;
                    }
                }
            }

            this.projectX = this.chatX[i];
            this.projectY = this.chatY[i] = y;

            const message: string | null = this.chats[i];

            if (this.chatEffects !== 0) {
                this.fontBold12?.centreString(this.projectX, this.projectY + 1, message, Colour.BLACK);
                this.fontBold12?.centreString(this.projectX, this.projectY, message, Colour.YELLOW);
            } else {
                let colour: number = Colour.YELLOW;
                if (this.chatColour[i] < 6) {
                    colour = Client.CHAT_COLORS[this.chatColour[i]];
                } else if (this.chatColour[i] === 6) {
                    colour = this.sceneCycle % 20 < 10 ? Colour.RED : Colour.YELLOW;
                } else if (this.chatColour[i] === 7) {
                    colour = this.sceneCycle % 20 < 10 ? Colour.BLUE : Colour.CYAN;
                } else if (this.chatColour[i] === 8) {
                    colour = this.sceneCycle % 20 < 10 ? 0xb000 : 0x80ff80;
                } else if (this.chatColour[i] === 9) {
                    const delta: number = 150 - this.chatTimer[i];
                    if (delta < 50) {
                        colour = delta * 1280 + Colour.RED;
                    } else if (delta < 100) {
                        colour = Colour.YELLOW - (delta - 50) * 327680;
                    } else if (delta < 150) {
                        colour = (delta - 100) * 5 + Colour.GREEN;
                    }
                } else if (this.chatColour[i] === 10) {
                    const delta: number = 150 - this.chatTimer[i];
                    if (delta < 50) {
                        colour = delta * 5 + Colour.RED;
                    } else if (delta < 100) {
                        colour = Colour.MAGENTA - (delta - 50) * 327680;
                    } else if (delta < 150) {
                        colour = (delta - 100) * 327680 + Colour.BLUE - (delta - 100) * 5;
                    }
                } else if (this.chatColour[i] === 11) {
                    const delta: number = 150 - this.chatTimer[i];
                    if (delta < 50) {
                        colour = Colour.WHITE - delta * 327685;
                    } else if (delta < 100) {
                        colour = (delta - 50) * 327685 + Colour.GREEN;
                    } else if (delta < 150) {
                        colour = Colour.WHITE - (delta - 100) * 327680;
                    }
                }

                if (this.chatEffect[i] === 0) {
                    this.fontBold12?.centreString(this.projectX, this.projectY + 1, message, Colour.BLACK);
                    this.fontBold12?.centreString(this.projectX, this.projectY, message, colour);
                } else if (this.chatEffect[i] === 1) {
                    this.fontBold12?.centerStringWave(this.projectX, this.projectY + 1, message, Colour.BLACK, this.sceneCycle);
                    this.fontBold12?.centerStringWave(this.projectX, this.projectY, message, colour, this.sceneCycle);
                } else if (this.chatEffect[i] === 2) {
                    const w: number = this.fontBold12?.stringWid(message) ?? 0;
                    const offsetX: number = ((150 - this.chatTimer[i]) * (w + 100)) / 150;
                    Pix2D.setClipping(this.projectX - 50, 0, this.projectX + 50, 334);
                    this.fontBold12?.drawString(this.projectX + 50 - offsetX, this.projectY + 1, message, Colour.BLACK);
                    this.fontBold12?.drawString(this.projectX + 50 - offsetX, this.projectY, message, colour);
                    Pix2D.resetClipping();
                }
            }
        }
    }

    // jag::oldscape::Client::GdmCoordArrow
    private coordArrow(): void {
        if (this.hintType !== 2 || !this.headicons[2]) {
            return;
        }

        this.getOverlayPos(((this.hintTileX - this.mapBuildBaseX) << 7) + this.hintOffsetX, this.hintHeight * 2, ((this.hintTileZ - this.mapBuildBaseZ) << 7) + this.hintOffsetZ);

        if (this.projectX > -1 && this.loopCycle % 20 < 10) {
            this.headicons[2].plotSprite(this.projectX - 12, this.projectY - 28);
        }
    }

    // jag::oldscape::Client::GetOverlayPos
    private getOverlayPosEntity(entity: ClientEntity, height: number): void {
        this.getOverlayPos(entity.x, height, entity.z);
    }

    // jag::oldscape::Client::GetOverlayPos
    private getOverlayPos(x: number, height: number, z: number): void {
        if (x < 128 || z < 128 || x > 13056 || z > 13056) {
            this.projectX = -1;
            this.projectY = -1;
            return;
        }

        const y: number = this.getAvH(this.minusedlevel, x, z) - height;

        let dx: number = x - this.camX;
        let dy: number = y - this.camY;
        let dz: number = z - this.camZ;

        const sinPitch: number = Pix3D.sinTable[this.camPitch];
        const cosPitch: number = Pix3D.cosTable[this.camPitch];
        const sinYaw: number = Pix3D.sinTable[this.camYaw];
        const cosYaw: number = Pix3D.cosTable[this.camYaw];

        let tmp: number = (dz * sinYaw + dx * cosYaw) >> 16;
        dz = (dz * cosYaw - dx * sinYaw) >> 16;
        dx = tmp;

        tmp = (dy * cosPitch - dz * sinPitch) >> 16;
        dz = (dy * sinPitch + dz * cosPitch) >> 16;
        dy = tmp;

        if (dz >= 50) {
            this.projectX = Pix3D.projectionX + (((dx << 9) / dz) | 0);
            this.projectY = Pix3D.projectionY + (((dy << 9) / dz) | 0);
        } else {
            this.projectX = -1;
            this.projectY = -1;
        }
    }

    // jag::oldscape::Client::GetAvH
    private getAvH(level: number, sceneX: number, sceneZ: number): number {
        if (!this.groundh) {
            return 0; // custom
        }

        const tileX: number = sceneX >> 7;
        const tileZ: number = sceneZ >> 7;

        if (tileX < 0 || tileZ < 0 || tileX > 103 || tileZ > 103) {
            return 0;
        }

        let realLevel: number = level;
        if (level < 3 && this.mapl && (this.mapl[1][tileX][tileZ] & MapFlag.LinkBelow) !== 0) {
            realLevel = level + 1;
        }

        const tileLocalX: number = sceneX & 0x7f;
        const tileLocalZ: number = sceneZ & 0x7f;
        const y00: number = (this.groundh[realLevel][tileX][tileZ] * (128 - tileLocalX) + this.groundh[realLevel][tileX + 1][tileZ] * tileLocalX) >> 7;
        const y11: number = (this.groundh[realLevel][tileX][tileZ + 1] * (128 - tileLocalX) + this.groundh[realLevel][tileX + 1][tileZ + 1] * tileLocalX) >> 7;
        return (y00 * (128 - tileLocalZ) + y11 * tileLocalZ) >> 7;
    }

    // jag::oldscape::dash3d::TextureCache::RunAnims
    private textureRunAnims(cycle: number): void {
        if (!Client.lowMem) {
            if (Pix3D.textureCycle[17] >= cycle) {
                const texture: Pix8 | null = Pix3D.textures[17];
                if (!texture) {
                    return;
                }

                const bottom: number = texture.wi * texture.hi - 1;
                const adjustment: number = texture.wi * this.sceneDelta * 2;

                const src: Int8Array = texture.data;
                const dst: Int8Array = this.textureBuffer;
                for (let i: number = 0; i <= bottom; i++) {
                    dst[i] = src[(i - adjustment) & bottom];
                }

                texture.data = dst;
                this.textureBuffer = src;
                Pix3D.pushTexture(17);
            }

            if (Pix3D.textureCycle[24] >= cycle) {
                const texture: Pix8 | null = Pix3D.textures[24];
                if (!texture) {
                    return;
                }
                const bottom: number = texture.wi * texture.hi - 1;
                const adjustment: number = texture.wi * this.sceneDelta * 2;

                const src: Int8Array = texture.data;
                const dst: Int8Array = this.textureBuffer;
                for (let i: number = 0; i <= bottom; i++) {
                    dst[i] = src[(i - adjustment) & bottom];
                }

                texture.data = dst;
                this.textureBuffer = src;
                Pix3D.pushTexture(24);
            }
        }
    }

    // jag::oldscape::Client::GdmOtherOverlays
    private otherOverlays(): void {
        this.drawPrivateMessages();

        if (this.crossMode === 1) {
            this.cross[(this.crossCycle / 100) | 0]?.plotSprite(this.crossX - 8 - 4, this.crossY - 8 - 4);
        } else if (this.crossMode === 2) {
            this.cross[((this.crossCycle / 100) | 0) + 4]?.plotSprite(this.crossX - 8 - 4, this.crossY - 8 - 4);

            Client.cyclelogic5++;
            if (Client.cyclelogic5 > 57) {
                Client.cyclelogic5 = 0;

                this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC5);
            }
        }

        if (this.mainOverlayLayerId !== -1) {
            this.animateLayer(this.mainOverlayLayerId, this.sceneDelta);
            this.drawLayer(IfType.list[this.mainOverlayLayerId], 0, 0, 0);
        }

        if (this.mainLayerId !== -1) {
            this.animateLayer(this.mainLayerId, this.sceneDelta);
            this.drawLayer(IfType.list[this.mainLayerId], 0, 0, 0);
        }

        this.getSpecialArea();

        if (!this.menuVisible) {
            this.buildMinimenu();
            this.drawTooltip();
        } else if (this.menuArea === 0) {
            this.drawMinimenu();
        }

        if (this.inMultizone === 1) {
            this.headicons[1]?.plotSprite(472, 296);
        }

        if (this.displayFps) {
            const x: number = 507;
            let y: number = 20;

            let colour: number = Colour.YELLOW;
            if (this.fps < 15) {
                colour = Colour.RED;
            }

            this.fontPlain12?.drawStringRight(x, y, 'Fps:' + this.fps, colour);
            y += 15;

            let memoryUsage = -1;
            if (typeof window.performance['memory' as keyof Performance] !== 'undefined') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const memory = window.performance['memory' as keyof Performance] as any;
                memoryUsage = (memory.usedJSHeapSize / 1024) | 0;
            }

            if (memoryUsage !== -1) {
                this.fontPlain12?.drawStringRight(x, y, 'Mem:' + memoryUsage + 'k', Colour.YELLOW);
            }
        }

        if (this.rebootTimer !== 0) {
            let seconds: number = (this.rebootTimer / 50) | 0;
            const minutes: number = (seconds / 60) | 0;
            seconds %= 60;

            if (seconds < 10) {
                this.fontPlain12?.drawString(4, 329, 'System update in: ' + minutes + ':0' + seconds, Colour.YELLOW);
            } else {
                this.fontPlain12?.drawString(4, 329, 'System update in: ' + minutes + ':' + seconds, Colour.YELLOW);
            }
        }
    }

    private drawPrivateMessages(): void {
        if (this.splitPrivateChat === 0) {
            return;
        }

        const font: PixFont | null = this.fontPlain12;
        let lineOffset: number = 0;
        if (this.rebootTimer !== 0) {
            lineOffset = 1;
        }

        for (let i: number = 0; i < 100; i++) {
            if (!this.messageText[i]) {
                continue;
            }

            const type: number = this.messageType[i];
            let sender = this.messageSender[i];

            let modlevel = 0;
            if (sender && sender.startsWith('@cr1@')) {
                sender = sender.substring(5);
                modlevel = 1;
            } else if (sender && sender.startsWith('@cr2@')) {
                sender = sender.substring(5);
                modlevel = 2;
            }

            if ((type == 3 || type == 7) && (type == 7 || this.chatPrivateMode == 0 || this.chatPrivateMode == 1 && this.isFriend(sender))) {
                const y = 329 - lineOffset * 13;
                let x = 4;

                font?.drawString(4, y, 'From', Colour.BLACK);
                font?.drawString(4, y - 1, 'From', Colour.CYAN);
                x += font?.stringWid('From ') ?? 0;

                if (modlevel == 1) {
                    this.modIcons[0].plotSprite(x, y - 12);
                    x += 14;
                } else if (modlevel == 2) {
                    this.modIcons[1].plotSprite(x, y - 12);
                    x += 14;
                }

                font?.drawString(x, y, sender + ': ' + this.messageText[i], Colour.BLACK);
                font?.drawString(x, y - 1, sender + ': ' + this.messageText[i], Colour.CYAN);

                lineOffset++;
                if (lineOffset >= 5) {
                    return;
                }
            } else if (type === 5 && this.chatPrivateMode < 2) {
                const y = 329 - lineOffset * 13;

                font?.drawString(4, y, this.messageText[i], Colour.BLACK);
                font?.drawString(4, y - 1, this.messageText[i], Colour.CYAN);

                lineOffset++;
                if (lineOffset >= 5) {
                    return;
                }
            } else if (type === 6 && this.chatPrivateMode < 2) {
                const y = 329 - lineOffset * 13;

                font?.drawString(4, y, 'To ' + sender + ': ' + this.messageText[i], Colour.BLACK);
                font?.drawString(4, y - 1, 'To ' + sender + ': ' + this.messageText[i], Colour.CYAN);

                lineOffset++;
                if (lineOffset >= 5) {
                    return;
                }
            }
        }
    }

    // jag::oldscape::Client::GdmGetSpecialArea
    private getSpecialArea(): void {
        if (!this.localPlayer) {
            return;
        }

        const x: number = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
        const z: number = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;

        this.chatDisabled = 0;

        // tutorial island
        if (x >= 3053 && x <= 3156 && z >= 3056 && z <= 3136) {
            this.chatDisabled = 1;
        } else if (x >= 3072 && x <= 3118 && z >= 9492 && z <= 9535) {
            this.chatDisabled = 1;
        }

        if (this.chatDisabled === 1 && x >= 3139 && x <= 3199 && z >= 3008 && z <= 3062) {
            this.chatDisabled = 0;
        }
    }

    private drawTooltip(): void {
        if (this.menuSize < 2 && this.objSelected === 0 && this.spellSelected === 0) {
            return;
        }

        let tooltip: string;
        if (this.objSelected === 1 && this.menuSize < 2) {
            tooltip = 'Use ' + this.objSelectedName + ' with...';
        } else if (this.spellSelected === 1 && this.menuSize < 2) {
            tooltip = this.spellCaption + '...';
        } else {
            tooltip = this.menuOption[this.menuSize - 1];
        }

        if (this.menuSize > 2) {
            tooltip = tooltip + '@whi@ / ' + (this.menuSize - 2) + ' more options';
        }

        this.fontBold12?.drawStringAntiMacro(4, 15, tooltip, Colour.WHITE, true, (this.loopCycle / 1000) | 0);
    }

    private drawMinimenu(): void {
        const x: number = this.menuX;
        const y: number = this.menuY;
        const w: number = this.menuWidth;
        const h: number = this.menuHeight;
        const background: number = 0x5d5447;

        Pix2D.fillRect(x, y, w, h, background);
        Pix2D.fillRect(x + 1, y + 1, w - 2, 16, Colour.BLACK);
        Pix2D.drawRect(x + 1, y + 18, w - 2, h - 19, Colour.BLACK);

        this.fontBold12?.drawString(x + 3, y + 14, 'Choose Option', background);

        let mouseX: number = this.mouseX;
        let mouseY: number = this.mouseY;
        if (this.menuArea === 0) {
            mouseX -= 4;
            mouseY -= 4;
        } else if (this.menuArea === 1) {
            mouseX -= 553;
            mouseY -= 205;
        } else if (this.menuArea === 2) {
            mouseX -= 17;
            mouseY -= 357;
        }

        for (let i: number = 0; i < this.menuSize; i++) {
            const optionY: number = y + (this.menuSize - 1 - i) * 15 + 31;

            let rgb: number = Colour.WHITE;
            if (mouseX > x && mouseX < x + w && mouseY > optionY - 13 && mouseY < optionY + 3) {
                rgb = Colour.YELLOW;
            }

            this.fontBold12?.drawStringTag(x + 3, optionY, this.menuOption[i], rgb, true);
        }
    }

    // jag::oldscape::minimap::Minimap::DrawDetail
    private drawDetail(tileX: number, tileZ: number, level: number, wallRgb: number, doorRgb: number): void {
        if (!this.world || !this.minimap) {
            return;
        }

        let typecode: number = this.world.wallType(level, tileX, tileZ);
        if (typecode !== 0) {
            const info: number = this.world.typecode2(level, tileX, tileZ, typecode);
            const angle: number = (info >> 6) & 0x3;
            const shape: number = info & 0x1f;
            let rgb: number = wallRgb;
            if (typecode > 0) {
                rgb = doorRgb;
            }

            const dst: Int32Array = this.minimap.data;
            const offset: number = tileX * 4 + (103 - tileZ) * 512 * 4 + 24624;
            const locId: number = (typecode >> 14) & 0x7fff;

            const loc: LocType = LocType.get(locId);
            if (loc.mapscene === -1) {
                if (shape === LocShape.WALL_STRAIGHT.id || shape === LocShape.WALL_L.id) {
                    if (angle === LocAngle.WEST) {
                        dst[offset] = rgb;
                        dst[offset + 512] = rgb;
                        dst[offset + 1024] = rgb;
                        dst[offset + 1536] = rgb;
                    } else if (angle === LocAngle.NORTH) {
                        dst[offset] = rgb;
                        dst[offset + 1] = rgb;
                        dst[offset + 2] = rgb;
                        dst[offset + 3] = rgb;
                    } else if (angle === LocAngle.EAST) {
                        dst[offset + 3] = rgb;
                        dst[offset + 3 + 512] = rgb;
                        dst[offset + 3 + 1024] = rgb;
                        dst[offset + 3 + 1536] = rgb;
                    } else if (angle === LocAngle.SOUTH) {
                        dst[offset + 1536] = rgb;
                        dst[offset + 1536 + 1] = rgb;
                        dst[offset + 1536 + 2] = rgb;
                        dst[offset + 1536 + 3] = rgb;
                    }
                }

                if (shape === LocShape.WALL_SQUARE_CORNER.id) {
                    if (angle === LocAngle.WEST) {
                        dst[offset] = rgb;
                    } else if (angle === LocAngle.NORTH) {
                        dst[offset + 3] = rgb;
                    } else if (angle === LocAngle.EAST) {
                        dst[offset + 3 + 1536] = rgb;
                    } else if (angle === LocAngle.SOUTH) {
                        dst[offset + 1536] = rgb;
                    }
                }

                if (shape === LocShape.WALL_L.id) {
                    if (angle === LocAngle.SOUTH) {
                        dst[offset] = rgb;
                        dst[offset + 512] = rgb;
                        dst[offset + 1024] = rgb;
                        dst[offset + 1536] = rgb;
                    } else if (angle === LocAngle.WEST) {
                        dst[offset] = rgb;
                        dst[offset + 1] = rgb;
                        dst[offset + 2] = rgb;
                        dst[offset + 3] = rgb;
                    } else if (angle === LocAngle.NORTH) {
                        dst[offset + 3] = rgb;
                        dst[offset + 3 + 512] = rgb;
                        dst[offset + 3 + 1024] = rgb;
                        dst[offset + 3 + 1536] = rgb;
                    } else if (angle === LocAngle.EAST) {
                        dst[offset + 1536] = rgb;
                        dst[offset + 1536 + 1] = rgb;
                        dst[offset + 1536 + 2] = rgb;
                        dst[offset + 1536 + 3] = rgb;
                    }
                }
            } else {
                const scene: Pix8 | null = this.mapscene[loc.mapscene];
                if (scene) {
                    const offsetX: number = ((loc.width * 4 - scene.wi) / 2) | 0;
                    const offsetY: number = ((loc.length * 4 - scene.hi) / 2) | 0;
                    scene.plotSprite(tileX * 4 + 48 + offsetX, (CollisionConstants.SIZE - tileZ - loc.length) * 4 + offsetY + 48);
                }
            }
        }

        typecode = this.world.sceneType(level, tileX, tileZ);
        if (typecode !== 0) {
            const info: number = this.world.typecode2(level, tileX, tileZ, typecode);
            const angle: number = (info >> 6) & 0x3;
            const shape: number = info & 0x1f;
            const locId: number = (typecode >> 14) & 0x7fff;

            const loc: LocType = LocType.get(locId);
            if (loc.mapscene === -1) {
                if (shape === LocShape.WALL_DIAGONAL.id) {
                    let rgb: number = 0xeeeeee;
                    if (typecode > 0) {
                        rgb = 0xee0000;
                    }

                    const dst: Int32Array = this.minimap.data;
                    const offset: number = tileX * 4 + (CollisionConstants.SIZE - 1 - tileZ) * 512 * 4 + 24624;

                    if (angle === LocAngle.WEST || angle === LocAngle.EAST) {
                        dst[offset + 1536] = rgb;
                        dst[offset + 1024 + 1] = rgb;
                        dst[offset + 512 + 2] = rgb;
                        dst[offset + 3] = rgb;
                    } else {
                        dst[offset] = rgb;
                        dst[offset + 512 + 1] = rgb;
                        dst[offset + 1024 + 2] = rgb;
                        dst[offset + 1536 + 3] = rgb;
                    }
                }
            } else {
                const scene: Pix8 | null = this.mapscene[loc.mapscene];
                if (scene) {
                    const offsetX: number = ((loc.width * 4 - scene.wi) / 2) | 0;
                    const offsetY: number = ((loc.length * 4 - scene.hi) / 2) | 0;
                    scene.plotSprite(tileX * 4 + 48 + offsetX, (CollisionConstants.SIZE - tileZ - loc.length) * 4 + offsetY + 48);
                }
            }
        }

        typecode = this.world.gdType(level, tileX, tileZ);
        if (typecode !== 0) {
            const locId = (typecode >> 14) & 0x7fff;

            const loc: LocType = LocType.get(locId);
            if (loc.mapscene !== -1) {
                const scene: Pix8 | null = this.mapscene[loc.mapscene];
                if (scene) {
                    const offsetX: number = ((loc.width * 4 - scene.wi) / 2) | 0;
                    const offsetY: number = ((loc.length * 4 - scene.hi) / 2) | 0;
                    scene.plotSprite(tileX * 4 + 48 + offsetX, (CollisionConstants.SIZE - tileZ - loc.length) * 4 + offsetY + 48);
                }
            }
        }
    }

    private interactWithLoc(opcode: number, x: number, z: number, typecode: number): boolean {
        if (!this.localPlayer || !this.world) {
            return false;
        }

        const locId: number = (typecode >> 14) & 0x7fff;
        const info: number = this.world.typecode2(this.minusedlevel, x, z, typecode);
        if (info === -1) {
            return false;
        }

        const shape: number = info & 0x1f;
        const angle: number = (info >> 6) & 0x3;

        Client.cyclelogic2++;
        if (Client.cyclelogic2 > 1086) {
            Client.cyclelogic2 = 0;

            this.out.pIsaac(ClientProt.ANTICHEAT_CYCLELOGIC2);
            this.out.p1(0);
            const start = this.out.pos;
            if (((Math.random() * 2.0) | 0) == 0) {
                this.out.p2(16791);
            }
            this.out.p1(254);
            this.out.p2((Math.random() * 65536.0) | 0);
            this.out.p2(16128);
            this.out.p2(52610);
            this.out.p2((Math.random() * 65536.0) | 0);
            this.out.p2(55420);
            if (((Math.random() * 2.0) | 0) == 0) {
                this.out.p2(35025);
            }
            this.out.p2(46628);
            this.out.p1((Math.random() * 256.0) | 0);
            this.out.psize1(this.out.pos - start);
        }

        if (shape === LocShape.CENTREPIECE_STRAIGHT.id || shape === LocShape.CENTREPIECE_DIAGONAL.id || shape === LocShape.GROUND_DECOR.id) {
            const loc: LocType = LocType.get(locId);

            let width: number;
            let height: number;
            if (angle === LocAngle.WEST || angle === LocAngle.EAST) {
                width = loc.width;
                height = loc.length;
            } else {
                width = loc.length;
                height = loc.width;
            }

            let forceapproach: number = loc.forceapproach;
            if (angle !== 0) {
                forceapproach = ((forceapproach << angle) & 0xf) + (forceapproach >> (4 - angle));
            }

            this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 2, width, height, 0, 0, forceapproach, false);
        } else {
            this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], x, z, 2, 0, 0, angle, shape + 1, 0, false);
        }

        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;

        this.out.pIsaac(opcode);
        this.out.p2(x + this.mapBuildBaseX);
        this.out.p2(z + this.mapBuildBaseZ);
        this.out.p2(locId);
        return true;
    }

    private tryMove(srcX: number, srcZ: number, dx: number, dz: number, type: number, locWidth: number, locLength: number, locAngle: number, locShape: number, forceapproach: number, tryNearest: boolean): boolean {
        const collisionMap: CollisionMap | null = this.levelCollisionMap[this.minusedlevel];
        if (!collisionMap) {
            return false;
        }

        const sceneWidth: number = CollisionConstants.SIZE;
        const sceneLength: number = CollisionConstants.SIZE;

        for (let x: number = 0; x < sceneWidth; x++) {
            for (let z: number = 0; z < sceneLength; z++) {
                const index: number = CollisionMap.index(x, z);
                this.dirMap[index] = 0;
                this.distMap[index] = 99999999;
            }
        }

        let x: number = srcX;
        let z: number = srcZ;

        const srcIndex: number = CollisionMap.index(srcX, srcZ);
        this.dirMap[srcIndex] = 99;
        this.distMap[srcIndex] = 0;

        let steps: number = 0;
        let length: number = 0;

        this.routeX[steps] = srcX;
        this.routeZ[steps++] = srcZ;

        let arrived: boolean = false;
        let bufferSize: number = this.routeX.length;
        const flags: Int32Array = collisionMap.flags;

        while (length !== steps) {
            x = this.routeX[length];
            z = this.routeZ[length];
            length = (length + 1) % bufferSize;

            if (x === dx && z === dz) {
                arrived = true;
                break;
            }

            if (locShape !== LocShape.WALL_STRAIGHT.id) {
                if ((locShape < LocShape.WALLDECOR_STRAIGHT_OFFSET.id || locShape === LocShape.CENTREPIECE_STRAIGHT.id) && collisionMap.testWall(x, z, dx, dz, locShape - 1, locAngle)) {
                    arrived = true;
                    break;
                }

                if (locShape < LocShape.CENTREPIECE_STRAIGHT.id && collisionMap.testWDecor(x, z, dx, dz, locShape - 1, locAngle)) {
                    arrived = true;
                    break;
                }
            }

            if (locWidth !== 0 && locLength !== 0 && collisionMap.testLoc(x, z, dx, dz, locWidth, locLength, forceapproach)) {
                arrived = true;
                break;
            }

            const nextCost: number = this.distMap[CollisionMap.index(x, z)] + 1;
            let index: number = CollisionMap.index(x - 1, z);
            if (x > 0 && this.dirMap[index] === 0 && (flags[index] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN) {
                this.routeX[steps] = x - 1;
                this.routeZ[steps] = z;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 2;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x + 1, z);
            if (x < sceneWidth - 1 && this.dirMap[index] === 0 && (flags[index] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN) {
                this.routeX[steps] = x + 1;
                this.routeZ[steps] = z;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 8;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x, z - 1);
            if (z > 0 && this.dirMap[index] === 0 && (flags[index] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN) {
                this.routeX[steps] = x;
                this.routeZ[steps] = z - 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 1;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x, z + 1);
            if (z < sceneLength - 1 && this.dirMap[index] === 0 && (flags[index] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN) {
                this.routeX[steps] = x;
                this.routeZ[steps] = z + 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 4;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x - 1, z - 1);
            if (
                x > 0 &&
                z > 0 &&
                this.dirMap[index] === 0 &&
                (flags[index] & CollisionFlag.BLOCK_SOUTH_WEST) === 0 &&
                (flags[CollisionMap.index(x - 1, z)] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN &&
                (flags[CollisionMap.index(x, z - 1)] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN
            ) {
                this.routeX[steps] = x - 1;
                this.routeZ[steps] = z - 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 3;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x + 1, z - 1);
            if (
                x < sceneWidth - 1 &&
                z > 0 &&
                this.dirMap[index] === 0 &&
                (flags[index] & CollisionFlag.BLOCK_SOUTH_EAST) === 0 &&
                (flags[CollisionMap.index(x + 1, z)] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN &&
                (flags[CollisionMap.index(x, z - 1)] & CollisionFlag.BLOCK_SOUTH) === CollisionFlag.OPEN
            ) {
                this.routeX[steps] = x + 1;
                this.routeZ[steps] = z - 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 9;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x - 1, z + 1);
            if (
                x > 0 &&
                z < sceneLength - 1 &&
                this.dirMap[index] === 0 &&
                (flags[index] & CollisionFlag.BLOCK_NORTH_WEST) === 0 &&
                (flags[CollisionMap.index(x - 1, z)] & CollisionFlag.BLOCK_WEST) === CollisionFlag.OPEN &&
                (flags[CollisionMap.index(x, z + 1)] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN
            ) {
                this.routeX[steps] = x - 1;
                this.routeZ[steps] = z + 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 6;
                this.distMap[index] = nextCost;
            }

            index = CollisionMap.index(x + 1, z + 1);
            if (
                x < sceneWidth - 1 &&
                z < sceneLength - 1 &&
                this.dirMap[index] === 0 &&
                (flags[index] & CollisionFlag.BLOCK_NORTH_EAST) === 0 &&
                (flags[CollisionMap.index(x + 1, z)] & CollisionFlag.BLOCK_EAST) === CollisionFlag.OPEN &&
                (flags[CollisionMap.index(x, z + 1)] & CollisionFlag.BLOCK_NORTH) === CollisionFlag.OPEN
            ) {
                this.routeX[steps] = x + 1;
                this.routeZ[steps] = z + 1;
                steps = (steps + 1) % bufferSize;
                this.dirMap[index] = 12;
                this.distMap[index] = nextCost;
            }
        }

        this.tryMoveNearest = 0;

        if (!arrived) {
            if (tryNearest) {
                let min: number = 100;
                for (let padding: number = 1; padding < 2; padding++) {
                    for (let px: number = dx - padding; px <= dx + padding; px++) {
                        for (let pz: number = dz - padding; pz <= dz + padding; pz++) {
                            const index: number = CollisionMap.index(px, pz);
                            if (px >= 0 && pz >= 0 && px < CollisionConstants.SIZE && pz < CollisionConstants.SIZE && this.distMap[index] < min) {
                                min = this.distMap[index];
                                x = px;
                                z = pz;
                                this.tryMoveNearest = 1;
                                arrived = true;
                            }
                        }
                    }

                    if (arrived) {
                        break;
                    }
                }
            }

            if (!arrived) {
                return false;
            }
        }

        length = 0;
        this.routeX[length] = x;
        this.routeZ[length++] = z;

        let dir: number = this.dirMap[CollisionMap.index(x, z)];
        let next: number = dir;
        while (x !== srcX || z !== srcZ) {
            if (next !== dir) {
                dir = next;
                this.routeX[length] = x;
                this.routeZ[length++] = z;
            }

            if ((next & DirectionFlag.EAST) !== 0) {
                x++;
            } else if ((next & DirectionFlag.WEST) !== 0) {
                x--;
            }

            if ((next & DirectionFlag.NORTH) !== 0) {
                z++;
            } else if ((next & DirectionFlag.SOUTH) !== 0) {
                z--;
            }

            next = this.dirMap[CollisionMap.index(x, z)];
        }

        if (length > 0) {
            bufferSize = Math.min(length, 25); // max number of turns in a single pf request
            length--;

            const startX: number = this.routeX[length];
            const startZ: number = this.routeZ[length];

            if (type === 0) {
                this.out.pIsaac(ClientProt.MOVE_GAMECLICK);
                this.out.p1(bufferSize + bufferSize + 3);
            } else if (type === 1) {
                this.out.pIsaac(ClientProt.MOVE_MINIMAPCLICK);
                this.out.p1(bufferSize + bufferSize + 3 + 14);
            } else if (type === 2) {
                this.out.pIsaac(ClientProt.MOVE_OPCLICK);
                this.out.p1(bufferSize + bufferSize + 3);
            }

            if (this.keyHeld[5] === 1) {
                this.out.p1(1);
            } else {
                this.out.p1(0);
            }

            this.out.p2(startX + this.mapBuildBaseX);
            this.out.p2(startZ + this.mapBuildBaseZ);

            this.minimapFlagX = this.routeX[0];
            this.minimapFlagZ = this.routeZ[0];

            for (let i: number = 1; i < bufferSize; i++) {
                length--;
                this.out.p1(this.routeX[length] - startX);
                this.out.p1(this.routeZ[length] - startZ);
            }

            return true;
        }

        return type !== 1;
    }

    // jag::oldscape::Client::TcpIn
    private async tcpIn(): Promise<boolean> {
        if (!this.stream) {
            return false;
        }

        try {
            let available: number = this.stream.available;
            if (available === 0) {
                return false;
            }

            if (this.ptype === -1) {
                await this.stream.readBytes(this.in.data, 0, 1);
                this.ptype = this.in.data[0] & 0xff;
                if (this.randomIn) {
                    this.ptype = (this.ptype - this.randomIn.nextInt) & 0xff;
                }
                this.psize = ServerProtSizes[this.ptype];
                available--;
            }

            if (this.psize === -1) {
                if (available <= 0) {
                    return false;
                }

                await this.stream.readBytes(this.in.data, 0, 1);
                this.psize = this.in.data[0] & 0xff;
                available--;
            }

            if (this.psize === -2) {
                if (available <= 1) {
                    return false;
                }

                await this.stream.readBytes(this.in.data, 0, 2);
                this.in.pos = 0;
                this.psize = this.in.g2();
                available -= 2;
            }

            if (available < this.psize) {
                return false;
            }

            this.in.pos = 0;
            await this.stream.readBytes(this.in.data, 0, this.psize);

            this.timeoutTimer = performance.now();
            this.ptype2 = this.ptype1;
            this.ptype1 = this.ptype0;
            this.ptype0 = this.ptype;

            if (this.ptype === ServerProt.IF_OPENCHAT) {
                const com: number = this.in.g2();

                this.resetInterfaceAnimation(com);

                if (this.sideLayerId !== -1) {
                    this.sideLayerId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }

                this.chatLayerId = com;
                this.redrawChatback = true;
                this.mainLayerId = -1;
                this.resumedPauseButton = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_OPENMAIN_SIDE) {
                const main: number = this.in.g2();
                const side: number = this.in.g2();

                if (this.chatLayerId !== -1) {
                    this.chatLayerId = -1;
                    this.redrawChatback = true;
                }

                if (this.dialogInputOpen) {
                    this.dialogInputOpen = false;
                    this.redrawChatback = true;
                }

                this.mainLayerId = main;
                this.sideLayerId = side;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.resumedPauseButton = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_CLOSE) {
                if (this.sideLayerId !== -1) {
                    this.sideLayerId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }

                if (this.chatLayerId !== -1) {
                    this.chatLayerId = -1;
                    this.redrawChatback = true;
                }

                if (this.dialogInputOpen) {
                    this.dialogInputOpen = false;
                    this.redrawChatback = true;
                }

                this.mainLayerId = -1;
                this.resumedPauseButton = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETTAB) {
                let com: number = this.in.g2();
                const tab: number = this.in.g1();

                if (com === 65535) {
                    com = -1;
                }

                this.sideTabLayerId[tab] = com;
                this.redrawSidebar = true;
                this.redrawSideicons = true;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_OPENMAIN) {
                const com: number = this.in.g2();

                this.resetInterfaceAnimation(com);

                if (this.sideLayerId !== -1) {
                    this.sideLayerId = -1;
                    this.redrawSidebar = true;
                    this.redrawSideicons = true;
                }

                if (this.chatLayerId !== -1) {
                    this.chatLayerId = -1;
                    this.redrawChatback = true;
                }

                if (this.dialogInputOpen) {
                    this.dialogInputOpen = false;
                    this.redrawChatback = true;
                }

                this.mainLayerId = com;
                this.resumedPauseButton = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_OPENSIDE) {
                const com: number = this.in.g2();

                this.resetInterfaceAnimation(com);

                if (this.chatLayerId !== -1) {
                    this.chatLayerId = -1;
                    this.redrawChatback = true;
                }

                if (this.dialogInputOpen) {
                    this.dialogInputOpen = false;
                    this.redrawChatback = true;
                }

                this.sideLayerId = com;
                this.redrawSidebar = true;
                this.redrawSideicons = true;
                this.mainLayerId = -1;
                this.resumedPauseButton = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETTAB_ACTIVE) {
                this.sideTab = this.in.g1();

                this.redrawSidebar = true;
                this.redrawSideicons = true;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_OPENOVERLAY) {
                const com = this.in.g2b();
                this.mainOverlayLayerId = com;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETCOLOUR) {
                const com: number = this.in.g2();
                const colour: number = this.in.g2();

                const r: number = (colour >> 10) & 0x1f;
                const g: number = (colour >> 5) & 0x1f;
                const b: number = colour & 0x1f;
                IfType.list[com].colour = (r << 19) + (g << 11) + (b << 3);

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETHIDE) {
                const comId: number = this.in.g2();
                const hide = this.in.g1() === 1;

                IfType.list[comId].hidden = hide;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETOBJECT) {
                const c: number = this.in.g2();
                const obj: number = this.in.g2();
                const zoom: number = this.in.g2();

                const type: ObjType = ObjType.get(obj);
                IfType.list[c].modelType = 4;
                IfType.list[c].modelId = obj;
                IfType.list[c].modelXAn = type.xan2d;
                IfType.list[c].modelYAn = type.yan2d;
                IfType.list[c].modelZoom = ((type.zoom2d * 100) / zoom) | 0;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETMODEL) {
                const com: number = this.in.g2();
                const m: number = this.in.g2();

                IfType.list[com].modelType = 1;
                IfType.list[com].modelId = m;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETANIM) {
                const com: number = this.in.g2();
                IfType.list[com].modelAnim = this.in.g2();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETPLAYERHEAD) {
                const comId = this.in.g2();

                if (this.localPlayer) {
                    IfType.list[comId].modelType = 3;
                    IfType.list[comId].modelId = (this.localPlayer.appearance[8] << 6) + (this.localPlayer.appearance[0] << 12) + (this.localPlayer.colour[0] << 24) + (this.localPlayer.colour[4] << 18) + this.localPlayer.appearance[11];
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETTEXT) {
                const comId: number = this.in.g2();
                const text = this.in.gjstr();

                IfType.list[comId].text = text;

                if (IfType.list[comId].layerId === this.sideTabLayerId[this.sideTab]) {
                    this.redrawSidebar = true;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETNPCHEAD) {
                const com: number = this.in.g2();
                const npcId: number = this.in.g2();

                IfType.list[com].modelType = 2;
                IfType.list[com].modelId = npcId;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETPOSITION) {
                const comId: number = this.in.g2();
                const x: number = this.in.g2b();
                const z: number = this.in.g2b();

                const com: IfType = IfType.list[comId];
                com.x = x;
                com.y = z;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.IF_SETSCROLLPOS) {
                const com: number = this.in.g2();
                let pos: number = this.in.g2();

                const inter = IfType.list[com];
                if (typeof inter !== 'undefined' && inter.type === ComponentType.TYPE_LAYER) {
                    if (pos < 0) {
                        pos = 0;
                    }

                    if (pos > inter.scrollSize - inter.height) {
                        pos = inter.scrollSize - inter.height;
                    }

                    inter.scrollPos = pos;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.TUT_FLASH) {
                this.flashingTab = this.in.g1();

                if (this.flashingTab === this.sideTab) {
                    if (this.flashingTab === 3) {
                        this.sideTab = 1;
                    } else {
                        this.sideTab = 3;
                    }

                    this.redrawSidebar = true;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.TUT_OPEN) {
                this.tutLayerId = this.in.g2b();
                this.redrawChatback = true;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_INV_STOP_TRANSMIT) {
                const component = this.in.g2();
                const inv: IfType = IfType.list[component];

                if (inv.linkObjType) {
                    for (let i: number = 0; i < inv.linkObjType.length; i++) {
                        inv.linkObjType[i] = -1;
                        inv.linkObjType[i] = 0;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_INV_FULL) {
                this.redrawSidebar = true;

                const component: number = this.in.g2();
                const inv: IfType = IfType.list[component];
                const size: number = this.in.g1();

                if (inv.linkObjType && inv.linkObjCount) {
                    for (let i: number = 0; i < size; i++) {
                        inv.linkObjType[i] = this.in.g2();

                        let count: number = this.in.g1();
                        if (count === 255) {
                            count = this.in.g4();
                        }

                        inv.linkObjCount[i] = count;
                    }

                    for (let i: number = size; i < inv.linkObjType.length; i++) {
                        inv.linkObjType[i] = 0;
                        inv.linkObjCount[i] = 0;
                    }
                } else {
                    for (let i: number = 0; i < size; i++) {
                        this.in.g2();

                        if (this.in.g1() === 255) {
                            this.in.g4();
                        }
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_INV_PARTIAL) {
                this.redrawSidebar = true;

                const component: number = this.in.g2();
                const inv: IfType = IfType.list[component];

                while (this.in.pos < this.psize) {
                    const slot: number = this.in.g1();
                    const id: number = this.in.g2();

                    let count: number = this.in.g1();
                    if (count === 255) {
                        count = this.in.g4();
                    }

                    if (inv.linkObjType && inv.linkObjCount && slot >= 0 && slot < inv.linkObjType.length) {
                        inv.linkObjType[slot] = id;
                        inv.linkObjCount[slot] = count;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.CAM_LOOKAT) {
                this.cinemaCam = true;

                this.camLookAtLx = this.in.g1();
                this.camLookAtLz = this.in.g1();
                this.camLookAtHei = this.in.g2();
                this.camLookAtRate = this.in.g1();
                this.camLookAtRate2 = this.in.g1();

                if (this.camLookAtRate2 >= 100) {
                    const sceneX: number = this.camLookAtLx * 128 + 64;
                    const sceneZ: number = this.camLookAtLz * 128 + 64;
                    const sceneY: number = this.getAvH(this.minusedlevel, sceneX, sceneZ) - this.camLookAtHei;

                    const deltaX: number = sceneX - this.camX;
                    const deltaY: number = sceneY - this.camY;
                    const deltaZ: number = sceneZ - this.camZ;

                    const distance: number = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ) | 0;

                    this.camPitch = ((Math.atan2(deltaY, distance) * 325.949) | 0) & 0x7ff;
                    this.camYaw = ((Math.atan2(deltaX, deltaZ) * -325.949) | 0) & 0x7ff;

                    if (this.camPitch < 128) {
                        this.camPitch = 128;
                    } else if (this.camPitch > 383) {
                        this.camPitch = 383;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.CAM_SHAKE) {
                const axis: number = this.in.g1();
                const ran: number = this.in.g1();
                const amp: number = this.in.g1();
                const rate: number = this.in.g1();

                this.camShake[axis] = true;
                this.camShakeAxis[axis] = ran;
                this.camShakeRan[axis] = amp;
                this.camShakeAmp[axis] = rate;
                this.camShakeCycle[axis] = 0;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.CAM_MOVETO) {
                this.cinemaCam = true;

                this.camMoveToLx = this.in.g1();
                this.camMoveToLz = this.in.g1();
                this.camMoveToHei = this.in.g2();
                this.camMoveToRate = this.in.g1();
                this.camMoveToRate2 = this.in.g1();

                if (this.camMoveToRate2 >= 100) {
                    this.camX = this.camMoveToLx * 128 + 64;
                    this.camZ = this.camMoveToLz * 128 + 64;
                    this.camY = this.getAvH(this.minusedlevel, this.camX, this.camZ) - this.camMoveToHei;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.CAM_RESET) {
                this.cinemaCam = false;

                for (let i: number = 0; i < 5; i++) {
                    this.camShake[i] = false;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.NPC_INFO) {
                this.getNpcPos(this.in, this.psize);

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.PLAYER_INFO) {
                this.getPlayerPos(this.in, this.psize);
                this.awaitingPlayerInfo = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.FINISH_TRACKING) {
                const tracking: Packet | null = InputTracking.stop();
                if (tracking) {
                    this.out.pIsaac(ClientProt.EVENT_TRACKING);
                    this.out.p2(tracking.pos);
                    this.out.pdata(tracking.data, tracking.pos, 0);
                    tracking.release();
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.ENABLE_TRACKING) {
                InputTracking.activate();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.MESSAGE_GAME) {
                const message: string = this.in.gjstr();

                if (message.endsWith(':tradereq:')) {
                    const player: string = message.substring(0, message.indexOf(':'));
                    const username = JString.toBase37(player);

                    let ignored: boolean = false;
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] === username) {
                            ignored = true;
                            break;
                        }
                    }

                    if (!ignored && this.chatDisabled === 0) {
                        this.addChat(4, 'wishes to trade with you.', player);
                    }
                } else if (message.endsWith(':duelreq:')) {
                    const player: string = message.substring(0, message.indexOf(':'));
                    const username = JString.toBase37(player);

                    let ignored: boolean = false;
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] === username) {
                            ignored = true;
                            break;
                        }
                    }

                    if (!ignored && this.chatDisabled === 0) {
                        this.addChat(8, 'wishes to duel with you.', player);
                    }
                } else {
                    this.addChat(0, message, '');
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_IGNORELIST) {
                this.ignoreCount = (this.psize / 8) | 0;
                for (let i: number = 0; i < this.ignoreCount; i++) {
                    this.ignoreName37[i] = this.in.g8();
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.CHAT_FILTER_SETTINGS) {
                this.chatPublicMode = this.in.g1();
                this.chatPrivateMode = this.in.g1();
                this.chatTradeMode = this.in.g1();

                this.redrawPrivacySettings = true;
                this.redrawChatback = true;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.MESSAGE_PRIVATE) {
                const from: bigint = this.in.g8();
                const messageId: number = this.in.g4();
                const staffModLevel: number = this.in.g1();

                let ignored: boolean = false;
                for (let i: number = 0; i < 100; i++) {
                    if (this.messageTextIds[i] === messageId) {
                        ignored = true;
                        break;
                    }
                }

                if (staffModLevel <= 1) {
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] === from) {
                            ignored = true;
                            break;
                        }
                    }
                }

                if (!ignored && this.chatDisabled === 0) {
                    try {
                        this.messageTextIds[this.privateMessageCount] = messageId;
                        this.privateMessageCount = (this.privateMessageCount + 1) % 100;
                        const uncompressed: string = WordPack.unpack(this.in, this.psize - 13);
                        const filtered: string = WordFilter.filter(uncompressed);

                        if (staffModLevel === 2 || staffModLevel === 3) {
                            this.addChat(7, filtered, '@cr2@' + JString.formatName(JString.fromBase37(from)));
                        } else if (staffModLevel === 1) {
                            this.addChat(7, filtered, '@cr1@' + JString.formatName(JString.fromBase37(from)));
                        } else {
                            this.addChat(3, filtered, JString.formatName(JString.fromBase37(from)));
                        }
                    } catch (_e) {
                        // signlink.reporterror('cde1'); TODO?
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.FRIENDLIST_LOADED) {
                this.friendListStatus = this.in.g1();
                this.redrawSidebar = true;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_FRIENDLIST) {
                const username: bigint = this.in.g8();
                const world: number = this.in.g1();

                let displayName: string | null = JString.formatName(JString.fromBase37(username));
                for (let i: number = 0; i < this.friendCount; i++) {
                    if (username === this.friendName37[i]) {
                        if (this.friendWorld[i] !== world) {
                            this.friendWorld[i] = world;
                            this.redrawSidebar = true;
                            if (world > 0) {
                                this.addChat(5, displayName + ' has logged in.', '');
                            }
                            if (world === 0) {
                                this.addChat(5, displayName + ' has logged out.', '');
                            }
                        }

                        displayName = null;
                        break;
                    }
                }

                if (displayName && this.friendCount < 200) {
                    this.friendName37[this.friendCount] = username;
                    this.friendName[this.friendCount] = displayName;
                    this.friendWorld[this.friendCount] = world;
                    this.friendCount++;
                    this.redrawSidebar = true;
                }

                let sorted: boolean = false;
                while (!sorted) {
                    sorted = true;

                    for (let i: number = 0; i < this.friendCount - 1; i++) {
                        if ((this.friendWorld[i] !== Client.nodeId && this.friendWorld[i + 1] === Client.nodeId) || (this.friendWorld[i] === 0 && this.friendWorld[i + 1] !== 0)) {
                            const oldWorld: number = this.friendWorld[i];
                            this.friendWorld[i] = this.friendWorld[i + 1];
                            this.friendWorld[i + 1] = oldWorld;

                            const oldName: string | null = this.friendName[i];
                            this.friendName[i] = this.friendName[i + 1];
                            this.friendName[i + 1] = oldName;

                            const oldName37: bigint = this.friendName37[i];
                            this.friendName37[i] = this.friendName37[i + 1];
                            this.friendName37[i + 1] = oldName37;
                            this.redrawSidebar = true;
                            sorted = false;
                        }
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UNSET_MAP_FLAG) {
                this.minimapFlagX = 0;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_RUNWEIGHT) {
                if (this.sideTab === 12) {
                    this.redrawSidebar = true;
                }

                this.runweight = this.in.g2b();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.HINT_ARROW) {
                this.hintType = this.in.g1();

                if (this.hintType === 1) {
                    this.hintNpc = this.in.g2();
                }

                if (this.hintType >= 2 && this.hintType <= 6) {
                    if (this.hintType === 2) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 64;
                    } else if (this.hintType === 3) {
                        this.hintOffsetX = 0;
                        this.hintOffsetZ = 64;
                    } else if (this.hintType === 4) {
                        this.hintOffsetX = 128;
                        this.hintOffsetZ = 64;
                    } else if (this.hintType === 5) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 0;
                    } else if (this.hintType === 6) {
                        this.hintOffsetX = 64;
                        this.hintOffsetZ = 128;
                    }

                    this.hintType = 2;
                    this.hintTileX = this.in.g2();
                    this.hintTileZ = this.in.g2();
                    this.hintHeight = this.in.g1();
                }

                if (this.hintType === 10) {
                    this.hintPlayer = this.in.g2();
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_REBOOT_TIMER) {
                this.rebootTimer = this.in.g2() * 30;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_STAT) {
                this.redrawSidebar = true;

                const stat: number = this.in.g1();
                const xp: number = this.in.g4();
                const level: number = this.in.g1();

                this.statXP[stat] = xp;
                this.statEffectiveLevel[stat] = level;
                this.statBaseLevel[stat] = 1;

                for (let i: number = 0; i < 98; i++) {
                    if (xp >= Client.levelExperience[i]) {
                        this.statBaseLevel[stat] = i + 2;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_RUNENERGY) {
                if (this.sideTab === 12) {
                    this.redrawSidebar = true;
                }

                this.runenergy = this.in.g1();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.RESET_ANIMS) {
                for (let i: number = 0; i < this.players.length; i++) {
                    const player: ClientPlayer | null = this.players[i];
                    if (!player) {
                        continue;
                    }

                    player.primaryAnim = -1;
                }

                for (let i: number = 0; i < this.npc.length; i++) {
                    const npc: ClientNpc | null = this.npc[i];
                    if (!npc) {
                        continue;
                    }

                    npc.primaryAnim = -1;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_PID) {
                this.localPid = this.in.g2();
                this.membersAccount = this.in.g1();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.LAST_LOGIN_INFO) {
                this.lastAddress = this.in.g4();
                this.daysSinceLastLogin = this.in.g2();
                this.daysSinceRecoveriesChanged = this.in.g1();
                this.unreadMessages = this.in.g2();
                this.warnMembersInNonMembers = this.in.g1();

                if (this.lastAddress !== 0 && this.mainLayerId === -1) {
                    this.closeModal();

                    let contentType: number = 650;
                    if (this.daysSinceRecoveriesChanged !== 201 || this.warnMembersInNonMembers == 1) {
                        contentType = 655;
                    }

                    this.reportAbuseInput = '';
                    this.reportAbuseMuteOption = false;

                    for (let i: number = 0; i < IfType.list.length; i++) {
                        if (IfType.list[i] && IfType.list[i].clientCode === contentType) {
                            this.mainLayerId = IfType.list[i].layerId;
                            break;
                        }
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.LOGOUT) {
                await this.logout();

                this.ptype = -1;
                return false;
            }

            if (this.ptype === ServerProt.P_COUNTDIALOG) {
                this.socialInputOpen = false;
                this.dialogInputOpen = true;
                this.chatbackInput = '';
                this.redrawChatback = true;

                if (this.isMobile) {
                    MobileKeyboard.show();
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.SET_MULTIWAY) {
                this.inMultizone = this.in.g1();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.SET_PLAYER_OP) {
                const index = this.in.g1();
                const priority = this.in.g1();
                let op: string | null = this.in.gjstr();

                if (index >= 1 && index <= 5) {
                    if (op.toLowerCase() === 'null') {
                        op = null;
                    }

                    this.playerOp[index - 1] = op;
                    this.playerOpPriority[index - 1] = priority === 0;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.REBUILD_NORMAL) {
                const zoneX: number = this.in.g2();
                const zoneZ: number = this.in.g2();

                if (this.mapBuildCenterZoneX === zoneX && this.mapBuildCenterZoneZ === zoneZ && this.sceneState !== 0) {
                    this.ptype = -1;
                    return true;
                }

                this.mapBuildCenterZoneX = zoneX;
                this.mapBuildCenterZoneZ = zoneZ;
                this.mapBuildBaseX = (this.mapBuildCenterZoneX - 6) * 8;
                this.mapBuildBaseZ = (this.mapBuildCenterZoneZ - 6) * 8;

                this.withinTutorialIsland = false;
                if ((this.mapBuildCenterZoneX / 8 == 48 || this.mapBuildCenterZoneX / 8 == 49) && this.mapBuildCenterZoneZ / 8 == 48) {
                    this.withinTutorialIsland = true;
                } else if (this.mapBuildCenterZoneX / 8 == 48 && this.mapBuildCenterZoneZ / 8 == 148) {
                    this.withinTutorialIsland = true;
                }

                this.sceneState = 1;
                this.sceneLoadStartTime = performance.now();

                this.areaViewport?.bind();
                this.fontPlain12?.centreString(257, 151, 'Loading - please wait.', Colour.BLACK);
                this.fontPlain12?.centreString(256, 150, 'Loading - please wait.', Colour.WHITE);
                this.areaViewport?.draw(4, 4);

                let regions = 0;
                for (let x = ((this.mapBuildCenterZoneX - 6) / 8) | 0; x <= (((this.mapBuildCenterZoneX + 6) / 8) | 0); x++) {
                    for (let z = ((this.mapBuildCenterZoneZ - 6) / 8) | 0; z <= (((this.mapBuildCenterZoneZ + 6) / 8) | 0); z++) {
                        regions++;
                    }
                }

                this.mapBuildGroundData = new TypedArray1d(regions, null);
                this.mapBuildLocationData = new TypedArray1d(regions, null);
                this.mapBuildIndex = new Int32Array(regions);
                this.mapBuildGroundFile = new Array(regions);
                this.mapBuildLocationFile = new Array(regions);

                let mapCount = 0;
                for (let x = ((this.mapBuildCenterZoneX - 6) / 8) | 0; x <= (((this.mapBuildCenterZoneX + 6) / 8) | 0); x++) {
                    for (let z = ((this.mapBuildCenterZoneZ - 6) / 8) | 0; z <= (((this.mapBuildCenterZoneZ + 6) / 8) | 0); z++) {
                        this.mapBuildIndex[mapCount] = (x << 8) + z;

                        if (this.withinTutorialIsland && (z == 49 || z == 149 || z == 147 || x == 50 || x == 49 && z == 47)) {
                            this.mapBuildGroundFile[mapCount] = -1;
                            this.mapBuildLocationFile[mapCount] = -1;
                            mapCount++;
                        } else if (this.onDemand) {
                            const landFile = this.mapBuildGroundFile[mapCount] = this.onDemand.getMapFile(x, z, 0);
                            if (landFile != -1) {
                                this.onDemand.request(3, landFile);
                            }

                            const locFile = this.mapBuildLocationFile[mapCount] = this.onDemand.getMapFile(x, z, 1);
                            if (locFile != -1) {
                                this.onDemand.request(3, locFile);
                            }

                            mapCount++;
                        }
                    }
                }

                const dx: number = this.mapBuildBaseX - this.mapBuildPrevBaseX;
                const dz: number = this.mapBuildBaseZ - this.mapBuildPrevBaseZ;
                this.mapBuildPrevBaseX = this.mapBuildBaseX;
                this.mapBuildPrevBaseZ = this.mapBuildBaseZ;

                for (let i: number = 0; i < 16384; i++) {
                    const npc: ClientNpc | null = this.npc[i];
                    if (npc) {
                        for (let j: number = 0; j < 10; j++) {
                            npc.routeX[j] -= dx;
                            npc.routeZ[j] -= dz;
                        }

                        npc.x -= dx * 128;
                        npc.z -= dz * 128;
                    }
                }

                for (let i: number = 0; i < Constants.MAX_PLAYER_COUNT; i++) {
                    const player: ClientPlayer | null = this.players[i];
                    if (player) {
                        for (let j: number = 0; j < 10; j++) {
                            player.routeX[j] -= dx;
                            player.routeZ[j] -= dz;
                        }

                        player.x -= dx * 128;
                        player.z -= dz * 128;
                    }
                }

                this.awaitingPlayerInfo = true;

                let startTileX: number = 0;
                let endTileX: number = CollisionConstants.SIZE;
                let dirX: number = 1;
                if (dx < 0) {
                    startTileX = CollisionConstants.SIZE - 1;
                    endTileX = -1;
                    dirX = -1;
                }

                let startTileZ: number = 0;
                let endTileZ: number = CollisionConstants.SIZE;
                let dirZ: number = 1;
                if (dz < 0) {
                    startTileZ = CollisionConstants.SIZE - 1;
                    endTileZ = -1;
                    dirZ = -1;
                }

                for (let x: number = startTileX; x !== endTileX; x += dirX) {
                    for (let z: number = startTileZ; z !== endTileZ; z += dirZ) {
                        const lastX: number = x + dx;
                        const lastZ: number = z + dz;

                        for (let level: number = 0; level < CollisionConstants.LEVELS; level++) {
                            if (lastX >= 0 && lastZ >= 0 && lastX < CollisionConstants.SIZE && lastZ < CollisionConstants.SIZE) {
                                this.objStacks[level][x][z] = this.objStacks[level][lastX][lastZ];
                            } else {
                                this.objStacks[level][x][z] = null;
                            }
                        }
                    }
                }

                for (let loc = this.locChanges.head(); loc !== null; loc = this.locChanges.next()) {
                    loc.x -= dx;
                    loc.z -= dz;

                    if (loc.x < 0 || loc.z < 0 || loc.x >= CollisionConstants.SIZE || loc.z >= CollisionConstants.SIZE) {
                        loc.unlink();
                    }
                }

                if (this.minimapFlagX !== 0) {
                    this.minimapFlagX -= dx;
                    this.minimapFlagZ -= dz;
                }

                this.cinemaCam = false;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.VARP_SMALL) {
                const variable: number = this.in.g2();
                const value: number = this.in.g1b();

                this.varServ[variable] = value;

                if (this.var[variable] !== value) {
                    this.var[variable] = value;
                    this.updateVarp(variable);

                    this.redrawSidebar = true;

                    if (this.tutLayerId !== -1) {
                        this.redrawChatback = true;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.VARP_LARGE) {
                const variable: number = this.in.g2();
                const value: number = this.in.g4();

                this.varServ[variable] = value;

                if (this.var[variable] !== value) {
                    this.var[variable] = value;
                    this.updateVarp(variable);

                    this.redrawSidebar = true;

                    if (this.tutLayerId !== -1) {
                        this.redrawChatback = true;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.VARP_SYNC) {
                // "Resetting variables to authoritative set"
                for (let i: number = 0; i < this.var.length; i++) {
                    if (this.var[i] !== this.varServ[i]) {
                        this.var[i] = this.varServ[i];
                        this.updateVarp(i);

                        this.redrawSidebar = true;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.SYNTH_SOUND) {
                const id: number = this.in.g2();
                const loop: number = this.in.g1();
                const delay: number = this.in.g2();

                if (this.waveEnabled && !Client.lowMem && this.waveCount < 50) {
                    this.waveIds[this.waveCount] = id;
                    this.waveLoops[this.waveCount] = loop;
                    this.waveDelay[this.waveCount] = delay + Wave.delays[id];
                    this.waveCount++;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.MIDI_SONG) {
                let id: number = this.in.g2();
                if (id == 65535) {
                    id = -1;
                }

                if (this.nextMidiSong != id && this.midiActive && !Client.lowMem) {
                    this.midiSong = id;
                    this.midiFading = true;
                    this.onDemand?.request(2, this.midiSong);
                }

                this.nextMidiSong = id;
                this.nextMusicDelay = 0;

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.MIDI_JINGLE) {
                const id: number = this.in.g2();
                const delay: number = this.in.g2();

                if (this.midiActive && !Client.lowMem) {
                    this.midiSong = id;
                    this.midiFading = false;
                    this.onDemand?.request(2, this.midiSong);
                    this.nextMusicDelay = delay;
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_ZONE_PARTIAL_FOLLOWS) {
                this.zoneUpdateX = this.in.g1();
                this.zoneUpdateZ = this.in.g1();

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_ZONE_FULL_FOLLOWS) {
                this.zoneUpdateX = this.in.g1();
                this.zoneUpdateZ = this.in.g1();

                for (let x: number = this.zoneUpdateX; x < this.zoneUpdateX + 8; x++) {
                    for (let z: number = this.zoneUpdateZ; z < this.zoneUpdateZ + 8; z++) {
                        if (this.objStacks[this.minusedlevel][x][z]) {
                            this.objStacks[this.minusedlevel][x][z] = null;
                            this.showObject(x, z);
                        }
                    }
                }

                for (let loc = this.locChanges.head(); loc !== null; loc = this.locChanges.next()) {
                    if (loc.x >= this.zoneUpdateX && loc.x < this.zoneUpdateX + 8 && loc.z >= this.zoneUpdateZ && loc.z < this.zoneUpdateZ + 8 && loc.level === this.minusedlevel) {
                        loc.endTime = 0;
                    }
                }

                this.ptype = -1;
                return true;
            }

            if (this.ptype === ServerProt.UPDATE_ZONE_PARTIAL_ENCLOSED) {
                this.zoneUpdateX = this.in.g1();
                this.zoneUpdateZ = this.in.g1();

                while (this.in.pos < this.psize) {
                    const opcode: number = this.in.g1();
                    this.zonePacket(this.in, opcode);
                }

                this.ptype = -1;
                return true;
            }

            if (
                this.ptype === ServerProt.OBJ_COUNT ||
                this.ptype === ServerProt.P_LOCMERGE ||
                this.ptype === ServerProt.OBJ_REVEAL ||
                this.ptype === ServerProt.MAP_ANIM ||
                this.ptype === ServerProt.MAP_PROJANIM ||
                this.ptype === ServerProt.OBJ_DEL ||
                this.ptype === ServerProt.OBJ_ADD ||
                this.ptype === ServerProt.LOC_ANIM ||
                this.ptype === ServerProt.LOC_DEL ||
                this.ptype === ServerProt.LOC_ADD_CHANGE
            ) {
                this.zonePacket(this.in, this.ptype);

                this.ptype = -1;
                return true;
            }

            // (java tries to report this to the world)
            console.error(`T1 - ${this.ptype},${this.psize} - ${this.ptype1},${this.ptype2}`);
            await this.logout();
        } catch (e) {
            if (e instanceof WebSocket && e.readyState === 3) {
                // IO error
                await this.tryReconnect();
            } else {
                // logic error
                console.error(e);

                let str = `T2 - ${this.ptype},${this.psize} - ${this.ptype1},${this.ptype2} - ${this.psize},${(this.localPlayer?.routeX[0] ?? 0) + this.mapBuildBaseX},${(this.localPlayer?.routeZ[0] ?? 0) + this.mapBuildBaseZ} -`;
                for (let i = 0; i < this.psize && i < 50; i++) {
                    str += this.in.data[i] + ',';
                }
                // (java tries to report this to the world)
                console.error(str);

                await this.logout();
            }
        }

        return true;
    }

    // jag::oldscape::Client::ZonePacket
    private zonePacket(buf: Packet, opcode: number): void {
        const pos: number = buf.g1();
        let x: number = this.zoneUpdateX + ((pos >> 4) & 0x7);
        let z: number = this.zoneUpdateZ + (pos & 0x7);

        if (opcode === ServerProt.LOC_ADD_CHANGE) {
            const info: number = buf.g1();
            const id: number = buf.g2();

            const shape: number = info >> 2;
            const rotate: number = info & 0x3;
            const layer: number = LocShape.of(shape).layer;

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                this.locChangeCreate(-1, id, rotate, layer, z, shape, this.minusedlevel, x, 0);
            }
        } else if (opcode === ServerProt.LOC_DEL) {
            const info: number = buf.g1();

            const shape: number = info >> 2;
            const rotate: number = info & 0x3;
            const layer: number = LocShape.of(shape).layer;

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                this.locChangeCreate(-1, -1, rotate, layer, z, shape, this.minusedlevel, x, 0);
            }
        } else if (opcode === ServerProt.LOC_ANIM) {
            const info: number = buf.g1();
            const seq: number = buf.g2();

            let shape: number = info >> 2;
            const rotate = info & 0x3;
            const layer: number = LocShape.of(shape).layer;

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE && this.world && this.groundh) {
                const heightSW = this.groundh[this.minusedlevel][x][z];
                const heightSE = this.groundh[this.minusedlevel][x + 1][z];
                const heightNE = this.groundh[this.minusedlevel][x + 1][z + 1];
                const heightNW = this.groundh[this.minusedlevel][x][z + 1];

                if (layer == 0) {
                    const wall = this.world.getWall(this.minusedlevel, x, z);
                    if (wall) {
                        const locId = wall.typecode >> 14 & 0x7FFF;
                        if (shape == 2) {
                            wall.model1 = new ClientLocAnim(this.loopCycle, locId, 2, rotate + 4, heightSW, heightSE, heightNE, heightNW, seq, false);
                            wall.model2 = new ClientLocAnim(this.loopCycle, locId, 2, (rotate + 1) & 0x3, heightSW, heightSE, heightNE, heightNW, seq, false);
                        } else {
                            wall.model1 = new ClientLocAnim(this.loopCycle, locId, shape, rotate, heightSW, heightSE, heightNE, heightNW, seq, false);
                        }
                    }
                } else if (layer == 1) {
                    const decor = this.world.getDecor(this.minusedlevel, z, x);
                    if (decor) {
                        decor.model = new ClientLocAnim(this.loopCycle, decor.typecode >> 14 & 0x7FFF, 4, 0, heightSW, heightNE, heightNE, heightNW, seq, false);
                    }
                } else if (layer == 2) {
                    const sprite = this.world.getScene(this.minusedlevel, x, z);
                    if (shape == 11) {
                        shape = 10;
                    }

                    if (sprite) {
                        sprite.model = new ClientLocAnim(this.loopCycle, sprite.typecode >> 14 & 0x7FFF, shape, rotate, heightSW, heightSE, heightNE, heightNW, seq, false);
                    }
                } else if (layer == 3) {
                    const decor = this.world.getGd(this.minusedlevel, x, z);
                    if (decor) {
                        decor.model = new ClientLocAnim(this.loopCycle, decor.typecode >> 14 & 0x7FFF, 22, rotate, heightSW, heightSE, heightNE, heightNW, seq, false);
                    }
                }
            }
        } else if (opcode === ServerProt.OBJ_ADD) {
            const type: number = buf.g2();
            const count: number = buf.g2();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                const obj: ClientObj = new ClientObj(type, count);
                if (!this.objStacks[this.minusedlevel][x][z]) {
                    this.objStacks[this.minusedlevel][x][z] = new LinkList();
                }

                this.objStacks[this.minusedlevel][x][z]?.push(obj);
                this.showObject(x, z);
            }
        } else if (opcode === ServerProt.OBJ_DEL) {
            const type: number = buf.g2();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                const objs = this.objStacks[this.minusedlevel][x][z];
                if (objs) {
                    for (let obj = objs.head(); obj !== null; obj = objs.next()) {
                        if (obj.id === (type & 0x7fff)) {
                            obj.unlink();
                            break;
                        }
                    }

                    if (objs.head() === null) {
                        this.objStacks[this.minusedlevel][x][z] = null;
                    }

                    this.showObject(x, z);
                }
            }
        } else if (opcode === ServerProt.MAP_PROJANIM) {
            let x2: number = x + buf.g1b();
            let z2: number = z + buf.g1b();
            const targetEntity: number = buf.g2b();
            const spotanim: number = buf.g2();
            const h1: number = buf.g1() * 4;
            const h2: number = buf.g1() * 4;
            const t1: number = buf.g2();
            const t2: number = buf.g2();
            const angle: number = buf.g1();
            const startpos: number = buf.g1();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE && x2 >= 0 && z2 >= 0 && x2 < CollisionConstants.SIZE && z2 < CollisionConstants.SIZE) {
                x = x * 128 + 64;
                z = z * 128 + 64;
                x2 = x2 * 128 + 64;
                z2 = z2 * 128 + 64;

                const proj: ClientProj = new ClientProj(spotanim, this.minusedlevel, x, this.getAvH(this.minusedlevel, x, z) - h1, z, t1 + this.loopCycle, t2 + this.loopCycle, angle, startpos, targetEntity, h2);
                proj.setTarget(x2, this.getAvH(this.minusedlevel, x2, z2) - h2, z2, t1 + this.loopCycle);
                this.projectiles.push(proj);
            }
        } else if (opcode === ServerProt.MAP_ANIM) {
            const spotanim: number = buf.g2();
            const height: number = buf.g1();
            const time: number = buf.g2();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                x = x * 128 + 64;
                z = z * 128 + 64;

                const spot: MapSpotAnim = new MapSpotAnim(spotanim, this.minusedlevel, x, z, this.getAvH(this.minusedlevel, x, z) - height, this.loopCycle, time);
                this.spotanims.push(spot);
            }
        } else if (opcode === ServerProt.OBJ_REVEAL) {
            const id: number = buf.g2();
            const count: number = buf.g2();
            const pid: number = buf.g2();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE && pid !== this.localPid) {
                if (!this.objStacks[this.minusedlevel][x][z]) {
                    this.objStacks[this.minusedlevel][x][z] = new LinkList();
                }

                const obj: ClientObj = new ClientObj(id, count);
                this.objStacks[this.minusedlevel][x][z]?.push(obj);
                this.showObject(x, z);
            }
        } else if (opcode === ServerProt.P_LOCMERGE) {
            const info: number = buf.g1();
            const shape: number = info >> 2;
            const rotate: number = info & 0x3;
            const layer: number = LocShape.of(shape).layer;

            const id: number = buf.g2();
            const t1: number = buf.g2();
            const t2: number = buf.g2();
            const pid: number = buf.g2();
            let east: number = buf.g1b();
            let south: number = buf.g1b();
            let west: number = buf.g1b();
            let north: number = buf.g1b();

            let player: ClientPlayer | null;
            if (pid === this.localPid) {
                player = this.localPlayer;
            } else {
                player = this.players[pid];
            }

            if (player && this.groundh) {
                const loc: LocType = LocType.get(id);

                const heightSW: number = this.groundh[this.minusedlevel][x][z];
                const heightSE: number = this.groundh[this.minusedlevel][x + 1][z];
                const heightNE: number = this.groundh[this.minusedlevel][x + 1][z + 1];
                const heightNW: number = this.groundh[this.minusedlevel][x][z + 1];

                const model = loc.getModel(shape, rotate, heightSW, heightSE, heightNE, heightNW, -1);
                if (model) {
                    this.locChangeCreate(t2 + 1, -1, 0, layer, z, 0, this.minusedlevel, x, t1 + 1);

                    player.locStartCycle = t1 + this.loopCycle;
                    player.locStopCycle = t2 + this.loopCycle;
                    player.locModel = model;

                    let width: number = loc.width;
                    let height: number = loc.length;
                    if (rotate === LocAngle.NORTH || rotate === LocAngle.SOUTH) {
                        width = loc.length;
                        height = loc.width;
                    }

                    player.locOffsetX = x * 128 + width * 64;
                    player.locOffsetZ = z * 128 + height * 64;
                    player.locOffsetY = this.getAvH(this.minusedlevel, player.locOffsetX, player.locOffsetZ);

                    let tmp: number;
                    if (east > west) {
                        tmp = east;
                        east = west;
                        west = tmp;
                    }

                    if (south > north) {
                        tmp = south;
                        south = north;
                        north = tmp;
                    }

                    player.minTileX = x + east;
                    player.maxTileX = x + west;
                    player.minTileZ = z + south;
                    player.maxTileZ = z + north;
                }
            }
        } else if (opcode === ServerProt.OBJ_COUNT) {
            const type: number = buf.g2();
            const ocount: number = buf.g2();
            const count: number = buf.g2();

            if (x >= 0 && z >= 0 && x < CollisionConstants.SIZE && z < CollisionConstants.SIZE) {
                const objs = this.objStacks[this.minusedlevel][x][z];
                if (objs) {
                    for (let obj = objs.head(); obj !== null; obj = objs.next()) {
                        if (obj.id === (type & 0x7fff) && obj.count === ocount) {
                            obj.count = count;
                            break;
                        }
                    }

                    this.showObject(x, z);
                }
            }
        }
    }

    // jag::oldscape::Client::LocChangeCreate
    private locChangeCreate(endTime: number, type: number, angle: number, layer: number, z: number, shape: number, level: number, x: number, startTime: number): void {
        let loc: LocChange | null = null;
        for (let next = this.locChanges.head(); next !== null; next = this.locChanges.next()) {
            if (next.level === this.minusedlevel && next.x === x && next.z === z && next.layer === layer) {
                loc = next;
                break;
            }
        }

        if (!loc) {
            loc = new LocChange();
            loc.level = level;
            loc.layer = layer;
            loc.x = x;
            loc.z = z;
            this.locChangeSetOld(loc);
            this.locChanges.push(loc);
        }

        loc.newType = type;
        loc.newShape = shape;
        loc.newAngle = angle;
        loc.startTime = startTime;
        loc.endTime = endTime;
    }

    // jag::oldscape::Client::LocChangeSetOld
    private locChangeSetOld(loc: LocChange): void {
        if (!this.world) {
            return;
        }

        let typecode: number = 0;
        let otherId: number = -1;
        let otherShape: number = 0;
        let otherAngle: number = 0;

        if (loc.layer === LocLayer.WALL) {
            typecode = this.world.wallType(loc.level, loc.x, loc.z);
        } else if (loc.layer === LocLayer.WALL_DECOR) {
            typecode = this.world.decorType(loc.level, loc.z, loc.x);
        } else if (loc.layer === LocLayer.GROUND) {
            typecode = this.world.sceneType(loc.level, loc.x, loc.z);
        } else if (loc.layer === LocLayer.GROUND_DECOR) {
            typecode = this.world.gdType(loc.level, loc.x, loc.z);
        }

        if (typecode !== 0) {
            const otherInfo: number = this.world.typecode2(loc.level, loc.x, loc.z, typecode);
            otherId = (typecode >> 14) & 0x7fff;
            otherShape = otherInfo & 0x1f;
            otherAngle = otherInfo >> 6;
        }

        loc.oldType = otherId;
        loc.oldShape = otherShape;
        loc.oldAngle = otherAngle;
    }

    // jag::oldscape::Client::LocChangeUnchecked
    private locChangeUnchecked(level: number, x: number, z: number, id: number, angle: number, shape: number, layer: number): void {
        if (x < 1 || z < 1 || x > 102 || z > 102) {
            return;
        }

        if (Client.lowMem && level !== this.minusedlevel) {
            return;
        }

        if (!this.world) {
            return;
        }

        let typecode: number = 0;
        if (layer === LocLayer.WALL) {
            typecode = this.world.wallType(level, x, z);
        } else if (layer === LocLayer.WALL_DECOR) {
            typecode = this.world.decorType(level, z, x);
        } else if (layer === LocLayer.GROUND) {
            typecode = this.world.sceneType(level, x, z);
        } else if (layer === LocLayer.GROUND_DECOR) {
            typecode = this.world.gdType(level, x, z);
        }

        if (typecode !== 0) {
            const otherInfo: number = this.world.typecode2(level, x, z, typecode);
            const otherId: number = (typecode >> 14) & 0x7fff;
            const otherShape: number = otherInfo & 0x1f;
            const otherAngle: number = otherInfo >> 6;

            if (layer === LocLayer.WALL) {
                this.world?.delWall(level, x, z);

                const type: LocType = LocType.get(otherId);
                if (type.blockwalk) {
                    this.levelCollisionMap[level]?.delWall(x, z, otherShape, otherAngle, type.blockrange);
                }
            } else if (layer === LocLayer.WALL_DECOR) {
                this.world?.delDecor(level, x, z);
            } else if (layer === LocLayer.GROUND) {
                this.world.delLoc(level, x, z);

                const type: LocType = LocType.get(otherId);
                if (x + type.width > CollisionConstants.SIZE - 1 || z + type.width > CollisionConstants.SIZE - 1 || x + type.length > CollisionConstants.SIZE - 1 || z + type.length > CollisionConstants.SIZE - 1) {
                    return;
                }

                if (type.blockwalk) {
                    this.levelCollisionMap[level]?.delLoc(x, z, type.width, type.length, otherAngle, type.blockrange);
                }
            } else if (layer === LocLayer.GROUND_DECOR) {
                this.world?.delGroundDecor(level, x, z);

                const type: LocType = LocType.get(otherId);
                if (type.blockwalk && type.active) {
                    this.levelCollisionMap[level]?.unblockGround(x, z);
                }
            }
        }

        if (id >= 0) {
            let tileLevel: number = level;
            if (this.mapl && level < 3 && (this.mapl[1][x][z] & MapFlag.LinkBelow) !== 0) {
                tileLevel = level + 1;
            }

            if (this.groundh) {
                ClientBuild.changeLocUnchecked(this.loopCycle, level, x, z, this.world, this.groundh, this.levelCollisionMap[level], id, shape, angle, tileLevel);
            }
        }
    }

    // jag::oldscape::Client::ShowObject
    private showObject(x: number, z: number): void {
        const objs = this.objStacks[this.minusedlevel][x][z];
        if (!objs) {
            this.world?.delObj(this.minusedlevel, x, z);
            return;
        }

        let topCost: number = -99999999;
        let topObj: ClientObj | null = null;

        for (let obj = objs.head(); obj !== null; obj = objs.next()) {
            const type: ObjType = ObjType.get(obj.id);
            let cost: number = type.cost;

            if (type.stackable) {
                cost *= obj.count + 1;
            }

            if (cost > topCost) {
                topCost = cost;
                topObj = obj;
            }
        }

        if (!topObj) {
            return; // custom
        }

        objs.addHead(topObj);

        let bottomObj: ClientObj | null = null;
        let middleObj: ClientObj | null = null;
        for (let obj = objs.head(); obj !== null; obj = objs.next()) {
            if (obj.id !== topObj.id && bottomObj === null) {
                bottomObj = obj;
            }

            if (obj.id !== topObj.id && bottomObj && obj.id !== bottomObj.id && middleObj === null) {
                middleObj = obj;
            }
        }

        const typecode: number = (x + (z << 7) + 0x60000000) | 0;
        this.world?.setObj(x, z, this.getAvH(this.minusedlevel, x * 128 + 64, z * 128 + 64), this.minusedlevel, typecode, topObj, middleObj, bottomObj);
    }

    private getPlayerPos(buf: Packet, size: number): void {
        this.entityRemovalCount = 0;
        this.entityUpdateCount = 0;

        this.getPlayerLocal(buf);
        this.getPlayerOldVis(buf);
        this.getPlayerNewVis(buf, size);
        this.getPlayerExtended(buf);

        for (let i: number = 0; i < this.entityRemovalCount; i++) {
            const index: number = this.entityRemovalIds[i];
            const player: ClientPlayer | null = this.players[index];
            if (!player) {
                continue;
            }

            if (player.cycle !== this.loopCycle) {
                this.players[index] = null;
            }
        }

        if (buf.pos !== size) {
            console.error(`eek! Error packet size mismatch in getplayer pos:${buf.pos} psize:${size}`);
            throw new Error('eek');
        }

        for (let index: number = 0; index < this.playerCount; index++) {
            if (!this.players[this.playerIds[index]]) {
                console.error(`eek! ${this.loginUser} null entry in pl list - pos:${index} size:${this.playerCount}`);
                throw new Error('eek');
            }
        }
    }

    private getPlayerLocal(buf: Packet): void {
        buf.bits();

        const info: number = buf.gBit(1);
        if (info !== 0) {
            const op: number = buf.gBit(2);

            if (op === 0) {
                this.entityUpdateIds[this.entityUpdateCount++] = Constants.LOCAL_PLAYER_INDEX;
            } else if (op === 1) {
                const walkDir: number = buf.gBit(3);
                this.localPlayer?.moveCode(false, walkDir);

                const extendedInfo: number = buf.gBit(1);
                if (extendedInfo === 1) {
                    this.entityUpdateIds[this.entityUpdateCount++] = Constants.LOCAL_PLAYER_INDEX;
                }
            } else if (op === 2) {
                const walkDir: number = buf.gBit(3);
                this.localPlayer?.moveCode(true, walkDir);

                const runDir: number = buf.gBit(3);
                this.localPlayer?.moveCode(true, runDir);

                const extendedInfo: number = buf.gBit(1);
                if (extendedInfo === 1) {
                    this.entityUpdateIds[this.entityUpdateCount++] = Constants.LOCAL_PLAYER_INDEX;
                }
            } else if (op === 3) {
                this.minusedlevel = buf.gBit(2);
                const localX: number = buf.gBit(7);
                const localZ: number = buf.gBit(7);
                const jump: number = buf.gBit(1);

                this.localPlayer?.teleport(jump === 1, localX, localZ);

                const extendedInfo: number = buf.gBit(1);
                if (extendedInfo === 1) {
                    this.entityUpdateIds[this.entityUpdateCount++] = Constants.LOCAL_PLAYER_INDEX;
                }
            }
        }
    }

    private getPlayerOldVis(buf: Packet): void {
        const count: number = buf.gBit(8);

        if (count < this.playerCount) {
            for (let i: number = count; i < this.playerCount; i++) {
                this.entityRemovalIds[this.entityRemovalCount++] = this.playerIds[i];
            }
        }

        if (count > this.playerCount) {
            console.error(`eek! ${this.loginUser} Too many players`);
            throw new Error();
        }

        this.playerCount = 0;
        for (let i: number = 0; i < count; i++) {
            const index: number = this.playerIds[i];
            const player: ClientPlayer | null = this.players[index];

            const info: number = buf.gBit(1);
            if (info === 0) {
                this.playerIds[this.playerCount++] = index;
                if (player) {
                    player.cycle = this.loopCycle;
                }
            } else {
                const op: number = buf.gBit(2);

                if (op === 0) {
                    this.playerIds[this.playerCount++] = index;
                    if (player) {
                        player.cycle = this.loopCycle;
                    }
                    this.entityUpdateIds[this.entityUpdateCount++] = index;
                } else if (op === 1) {
                    this.playerIds[this.playerCount++] = index;
                    if (player) {
                        player.cycle = this.loopCycle;
                    }

                    const walkDir: number = buf.gBit(3);
                    player?.moveCode(false, walkDir);

                    const extendedInfo: number = buf.gBit(1);
                    if (extendedInfo === 1) {
                        this.entityUpdateIds[this.entityUpdateCount++] = index;
                    }
                } else if (op === 2) {
                    this.playerIds[this.playerCount++] = index;
                    if (player) {
                        player.cycle = this.loopCycle;
                    }

                    const walkDir: number = buf.gBit(3);
                    player?.moveCode(true, walkDir);

                    const runDir: number = buf.gBit(3);
                    player?.moveCode(true, runDir);

                    const extendedInfo: number = buf.gBit(1);
                    if (extendedInfo === 1) {
                        this.entityUpdateIds[this.entityUpdateCount++] = index;
                    }
                } else if (op === 3) {
                    this.entityRemovalIds[this.entityRemovalCount++] = index;
                }
            }
        }
    }

    private getPlayerNewVis(buf: Packet, size: number): void {
        while (buf.bitPos + 10 < size * 8) {
            const index = buf.gBit(11);
            if (index === 2047) {
                break;
            }

            if (!this.players[index]) {
                this.players[index] = new ClientPlayer();

                const appearance: Packet | null = this.playerAppearanceBuffer[index];
                if (appearance) {
                    this.players[index]?.setAppearance(appearance);
                }
            }

            this.playerIds[this.playerCount++] = index;
            const player: ClientPlayer | null = this.players[index];
            if (player) {
                player.cycle = this.loopCycle;
            }

            let dx: number = buf.gBit(5);
            if (dx > 15) {
                dx -= 32;
            }

            let dz: number = buf.gBit(5);
            if (dz > 15) {
                dz -= 32;
            }

            const jump: number = buf.gBit(1);

            if (this.localPlayer) {
                player?.teleport(jump === 1, this.localPlayer.routeX[0] + dx, this.localPlayer.routeZ[0] + dz);
            }

            const extendedInfo: number = buf.gBit(1);
            if (extendedInfo === 1) {
                this.entityUpdateIds[this.entityUpdateCount++] = index;
            }
        }

        buf.bytes();
    }

    // jag::oldscape::ReceivePlayerPositions::GetPlayerPositionsExtended
    private getPlayerExtended(buf: Packet): void {
        for (let i: number = 0; i < this.entityUpdateCount; i++) {
            const index: number = this.entityUpdateIds[i];
            const player: ClientPlayer | null = this.players[index];
            if (!player) {
                continue;
            }

            let mask: number = buf.g1();
            if ((mask & PlayerUpdate.BIG_UPDATE) !== 0) {
                mask += buf.g1() << 8;
            }

            this.getPlayerExtendedDecode(player, index, mask, buf);
        }
    }

    // jag::oldscape::ReceivePlayerPositions::DecodeExtend
    private getPlayerExtendedDecode(player: ClientPlayer, index: number, mask: number, buf: Packet): void {
        if ((mask & PlayerUpdate.APPEARANCE) !== 0) {
            const length: number = buf.g1();

            const data: Uint8Array = new Uint8Array(length);
            const appearance: Packet = new Packet(data);
            buf.gdata(length, 0, data);

            this.playerAppearanceBuffer[index] = appearance;
            player.setAppearance(appearance);
        }

        if ((mask & PlayerUpdate.ANIM) !== 0) {
            let seqId: number = buf.g2();
            if (seqId === 65535) {
                seqId = -1;
            }

            if (seqId === player.primaryAnim) {
                player.primaryAnimLoop = 0;
            }

            const delay: number = buf.g1();
            if (player.primaryAnim === seqId && seqId !== -1) {
                const restartMode = SeqType.list[seqId].duplicatebehavior;

                if (restartMode == RestartMode.RESET) {
                    player.primaryAnimFrame = 0;
                    player.primaryAnimCycle = 0;
                    player.primaryAnimDelay = delay;
                    player.primaryAnimLoop = 0;
                } else if (restartMode == RestartMode.RESETLOOP) {
                    player.primaryAnimLoop = 0;
                }
            } else if (seqId === -1 || player.primaryAnim === -1 || SeqType.list[seqId].priority >= SeqType.list[player.primaryAnim].priority) {
                player.primaryAnim = seqId;
                player.primaryAnimFrame = 0;
                player.primaryAnimCycle = 0;
                player.primaryAnimDelay = delay;
                player.primaryAnimLoop = 0;
                player.preanimRouteLength = player.routeLength;
            }
        }

        if ((mask & PlayerUpdate.FACEENTITY) !== 0) {
            player.faceEntity = buf.g2();
            if (player.faceEntity === 65535) {
                player.faceEntity = -1;
            }
        }

        if ((mask & PlayerUpdate.SAY) !== 0) {
            player.chatMessage = buf.gjstr();
            player.chatColour = 0;
            player.chatEffect = 0;
            player.chatTimer = 150;

            if (player.name) {
                this.addChat(2, player.chatMessage, player.name);
            }
        }

        if ((mask & PlayerUpdate.HITMARK) !== 0) {
            const damage = buf.g1();
            const damageType = buf.g1();

            player.addHitmark(this.loopCycle, damageType, damage);
            player.combatCycle = this.loopCycle + 400;
            player.health = buf.g1();
            player.totalHealth = buf.g1();
        }

        if ((mask & PlayerUpdate.FACESQUARE) !== 0) {
            player.faceSquareX = buf.g2();
            player.faceSquareZ = buf.g2();
        }

        if ((mask & PlayerUpdate.CHAT) !== 0) {
            const colourEffect: number = buf.g2();
            const type: number = buf.g1();
            const length: number = buf.g1();
            const start: number = buf.pos;

            if (player.name && player.ready) {
                const username: bigint = JString.toBase37(player.name);
                let ignored: boolean = false;

                if (type <= 1) {
                    for (let i: number = 0; i < this.ignoreCount; i++) {
                        if (this.ignoreName37[i] === username) {
                            ignored = true;
                            break;
                        }
                    }
                }

                if (!ignored && this.chatDisabled === 0) {
                    try {
                        const uncompressed: string = WordPack.unpack(buf, length);
                        const filtered: string = WordFilter.filter(uncompressed);
                        player.chatMessage = filtered;
                        player.chatColour = colourEffect >> 8;
                        player.chatEffect = colourEffect & 0xff;
                        player.chatTimer = 150;

                        if (type === 2 || type === 3) {
                            this.addChat(1, filtered, '@cr2@' + player.name);
                        } else if (type === 1) {
                            this.addChat(1, filtered, '@cr1@' + player.name);
                        } else {
                            this.addChat(2, filtered, player.name);
                        }
                    } catch (_e) {
                        // signlink.reporterror('cde2');
                    }
                }
            }

            buf.pos = start + length;
        }

        if ((mask & PlayerUpdate.SPOTANIM) !== 0) {
            player.spotanimId = buf.g2();
            const heightDelay: number = buf.g4();

            player.spotanimHeight = heightDelay >> 16;
            player.spotanimLastCycle = this.loopCycle + (heightDelay & 0xffff);
            player.spotanimFrame = 0;
            player.spotanimCycle = 0;

            if (player.spotanimLastCycle > this.loopCycle) {
                player.spotanimFrame = -1;
            }

            if (player.spotanimId === 65535) {
                player.spotanimId = -1;
            }
        }

        if ((mask & PlayerUpdate.EXACTMOVE) !== 0) {
            player.exactStartX = buf.g1();
            player.exactStartZ = buf.g1();
            player.exactEndX = buf.g1();
            player.exactEndZ = buf.g1();
            player.exactMoveEnd = buf.g2() + this.loopCycle;
            player.exactMoveStart = buf.g2() + this.loopCycle;
            player.exactMoveFacing = buf.g1();

            player.abortRoute();
        }

        if ((mask & PlayerUpdate.HITMARK2) !== 0) {
            const damage = buf.g1();
            const damageType = buf.g1();

            player.addHitmark(this.loopCycle, damageType, damage);
            player.combatCycle = this.loopCycle + 400;
            player.health = buf.g1();
            player.totalHealth = buf.g1();
        }
    }

    // jag::oldscape::Client::GetNPCPos
    private getNpcPos(buf: Packet, size: number): void {
        this.entityRemovalCount = 0;
        this.entityUpdateCount = 0;

        this.getNpcPosOldVis(buf);
        this.getNpcPosNewVis(buf, size);
        this.getNpcPosExtended(buf);

        for (let i: number = 0; i < this.entityRemovalCount; i++) {
            const index: number = this.entityRemovalIds[i];
            const npc: ClientNpc | null = this.npc[index];
            if (!npc) {
                continue;
            }

            if (npc.cycle !== this.loopCycle) {
                npc.type = null;
                this.npc[index] = null;
            }
        }

        if (buf.pos !== size) {
            console.error(`eek! ${this.loginUser} size mismatch in getnpcpos - pos:${buf.pos} psize:${size}`);
            throw new Error('eek');
        }

        for (let i: number = 0; i < this.npcCount; i++) {
            if (!this.npc[this.npcIds[i]]) {
                console.error(`eek! ${this.loginUser} null entry in npc list - pos:${i} size:${this.npcCount}`);
                throw new Error('eek');
            }
        }
    }

    // jag::oldscape::Client::GetNPCPosOldVis
    private getNpcPosOldVis(buf: Packet): void {
        buf.bits();

        const count: number = buf.gBit(8);
        if (count < this.npcCount) {
            for (let i: number = count; i < this.npcCount; i++) {
                this.entityRemovalIds[this.entityRemovalCount++] = this.npcIds[i];
            }
        }

        if (count > this.npcCount) {
            console.error(`eek! ${this.loginUser} Too many npcs`);
            throw new Error('eek');
        }

        this.npcCount = 0;
        for (let i: number = 0; i < count; i++) {
            const index: number = this.npcIds[i];
            const npc: ClientNpc | null = this.npc[index];

            const info: number = buf.gBit(1);
            if (info === 0) {
                this.npcIds[this.npcCount++] = index;
                if (npc) {
                    npc.cycle = this.loopCycle;
                }
            } else {
                const op: number = buf.gBit(2);

                if (op === 0) {
                    this.npcIds[this.npcCount++] = index;
                    if (npc) {
                        npc.cycle = this.loopCycle;
                    }
                    this.entityUpdateIds[this.entityUpdateCount++] = index;
                } else if (op === 1) {
                    this.npcIds[this.npcCount++] = index;
                    if (npc) {
                        npc.cycle = this.loopCycle;
                    }

                    const walkDir: number = buf.gBit(3);
                    npc?.moveCode(false, walkDir);

                    const extendedInfo: number = buf.gBit(1);
                    if (extendedInfo === 1) {
                        this.entityUpdateIds[this.entityUpdateCount++] = index;
                    }
                } else if (op === 2) {
                    this.npcIds[this.npcCount++] = index;
                    if (npc) {
                        npc.cycle = this.loopCycle;
                    }

                    const walkDir: number = buf.gBit(3);
                    npc?.moveCode(true, walkDir);

                    const runDir: number = buf.gBit(3);
                    npc?.moveCode(true, runDir);

                    const extendedInfo: number = buf.gBit(1);
                    if (extendedInfo === 1) {
                        this.entityUpdateIds[this.entityUpdateCount++] = index;
                    }
                } else if (op === 3) {
                    this.entityRemovalIds[this.entityRemovalCount++] = index;
                }
            }
        }
    }

    // jag::oldscape::Client::GetNPCPosNewVis
    private getNpcPosNewVis(buf: Packet, size: number): void {
        while (buf.bitPos + 21 < size * 8) {
            const index: number = buf.gBit(14);
            if (index === 16383) {
                break;
            }

            if (!this.npc[index]) {
                this.npc[index] = new ClientNpc();
            }

            const npc: ClientNpc | null = this.npc[index];
            this.npcIds[this.npcCount++] = index;

            if (npc) {
                npc.cycle = this.loopCycle;
                npc.type = NpcType.get(buf.gBit(11));
                npc.size = npc.type.size;
                npc.turnspeed = npc.type.turnspeed;
                npc.walkanim = npc.type.walkanim;
                npc.walkanim_b = npc.type.walkanim_b;
                npc.walkanim_l = npc.type.walkanim_r;
                npc.walkanim_r = npc.type.walkanim_l;
                npc.readyanim = npc.type.readyanim;
            } else {
                buf.gBit(11);
            }

            let dx: number = buf.gBit(5);
            if (dx > 15) {
                dx -= 32;
            }

            let dz: number = buf.gBit(5);
            if (dz > 15) {
                dz -= 32;
            }

            if (this.localPlayer) {
                npc?.teleport(false, this.localPlayer.routeX[0] + dx, this.localPlayer.routeZ[0] + dz);
            }

            const extendedInfo: number = buf.gBit(1);
            if (extendedInfo === 1) {
                this.entityUpdateIds[this.entityUpdateCount++] = index;
            }
        }

        buf.bytes();
    }

    // jag::oldscape::Client::GetNPCPosExtended
    private getNpcPosExtended(buf: Packet): void {
        for (let i: number = 0; i < this.entityUpdateCount; i++) {
            const id: number = this.entityUpdateIds[i];
            const npc: ClientNpc | null = this.npc[id];
            if (!npc) {
                continue;
            }

            const mask: number = buf.g1();

            if ((mask & NpcUpdate.HITMARK2) !== 0) {
                const damage = buf.g1();
                const damageType = buf.g1();

                npc.addHitmark(this.loopCycle, damageType, damage);
                npc.combatCycle = this.loopCycle + 400;
                npc.health = buf.g1();
                npc.totalHealth = buf.g1();
            }

            if ((mask & NpcUpdate.ANIM) !== 0) {
                let anim: number = buf.g2();
                if (anim === 65535) {
                    anim = -1;
                }

                if (anim === npc.primaryAnim) {
                    npc.primaryAnimLoop = 0;
                }

                const delay: number = buf.g1();
                if (npc.primaryAnim === anim && anim !== -1) {
                    const restartMode = SeqType.list[anim].duplicatebehavior;

                    if (restartMode == RestartMode.RESET) {
                        npc.primaryAnimFrame = 0;
                        npc.primaryAnimCycle = 0;
                        npc.primaryAnimDelay = delay;
                        npc.primaryAnimLoop = 0;
                    } else if (restartMode == RestartMode.RESETLOOP) {
                        npc.primaryAnimLoop = 0;
                    }
                } else if (anim === -1 || npc.primaryAnim === -1 || SeqType.list[anim].priority >= SeqType.list[npc.primaryAnim].priority) {
                    npc.primaryAnim = anim;
                    npc.primaryAnimFrame = 0;
                    npc.primaryAnimCycle = 0;
                    npc.primaryAnimDelay = delay;
                    npc.primaryAnimLoop = 0;
                    npc.preanimRouteLength = npc.routeLength;
                }
            }

            if ((mask & NpcUpdate.FACEENTITY) !== 0) {
                npc.faceEntity = buf.g2();
                if (npc.faceEntity === 65535) {
                    npc.faceEntity = -1;
                }
            }

            if ((mask & NpcUpdate.SAY) !== 0) {
                npc.chatMessage = buf.gjstr();
                npc.chatTimer = 100;
            }

            if ((mask & NpcUpdate.HITMARK) !== 0) {
                const damage = buf.g1();
                const damageType = buf.g1();

                npc.addHitmark(this.loopCycle, damageType, damage);
                npc.combatCycle = this.loopCycle + 400;
                npc.health = buf.g1();
                npc.totalHealth = buf.g1();
            }

            if ((mask & NpcUpdate.CHANGETYPE) !== 0) {
                npc.type = NpcType.get(buf.g2());
                npc.size = npc.type.size;
                npc.turnspeed = npc.type.turnspeed;
                npc.walkanim = npc.type.walkanim;
                npc.walkanim_b = npc.type.walkanim_b;
                npc.walkanim_l = npc.type.walkanim_r;
                npc.walkanim_r = npc.type.walkanim_l;
                npc.readyanim = npc.type.readyanim;
            }

            if ((mask & NpcUpdate.SPOTANIM) !== 0) {
                npc.spotanimId = buf.g2();
                const info: number = buf.g4();

                npc.spotanimHeight = info >> 16;
                npc.spotanimLastCycle = this.loopCycle + (info & 0xffff);
                npc.spotanimFrame = 0;
                npc.spotanimCycle = 0;

                if (npc.spotanimLastCycle > this.loopCycle) {
                    npc.spotanimFrame = -1;
                }

                if (npc.spotanimId === 65535) {
                    npc.spotanimId = -1;
                }
            }

            if ((mask & NpcUpdate.FACESQUARE) !== 0) {
                npc.faceSquareX = buf.g2();
                npc.faceSquareZ = buf.g2();
            }
        }
    }

    private showContextMenu(): void {
        let width: number = 0;
        if (this.fontBold12) {
            width = this.fontBold12.stringWid('Choose Option');
            let maxWidth: number;
            for (let i: number = 0; i < this.menuSize; i++) {
                maxWidth = this.fontBold12.stringWid(this.menuOption[i]);
                if (maxWidth > width) {
                    width = maxWidth;
                }
            }
        }
        width += 8;

        const height: number = this.menuSize * 15 + 21;

        let x: number;
        let y: number;

        // the main viewport area
        if (this.mouseClickX > 4 && this.mouseClickY > 4 && this.mouseClickX < 516 && this.mouseClickY < 338) {
            x = this.mouseClickX - ((width / 2) | 0) - 4;
            if (x + width > 512) {
                x = 512 - width;
            }
            if (x < 0) {
                x = 0;
            }

            y = this.mouseClickY - 4;
            if (y + height > 334) {
                y = 334 - height;
            }
            if (y < 0) {
                y = 0;
            }

            this.menuVisible = true;
            this.menuArea = 0;
            this.menuX = x;
            this.menuY = y;
            this.menuWidth = width;
            this.menuHeight = this.menuSize * 15 + 22;
        }

        // the sidebar/tabs area
        if (this.mouseClickX > 553 && this.mouseClickY > 205 && this.mouseClickX < 743 && this.mouseClickY < 466) {
            x = this.mouseClickX - ((width / 2) | 0) - 553;
            if (x < 0) {
                x = 0;
            } else if (x + width > 190) {
                x = 190 - width;
            }

            y = this.mouseClickY - 205;
            if (y < 0) {
                y = 0;
            } else if (y + height > 261) {
                y = 261 - height;
            }

            this.menuVisible = true;
            this.menuArea = 1;
            this.menuX = x;
            this.menuY = y;
            this.menuWidth = width;
            this.menuHeight = this.menuSize * 15 + 22;
        }

        // the chatbox area
        if (this.mouseClickX > 17 && this.mouseClickY > 357 && this.mouseClickX < 496 && this.mouseClickY < 453) {
            x = this.mouseClickX - ((width / 2) | 0) - 17;
            if (x < 0) {
                x = 0;
            } else if (x + width > 479) {
                x = 479 - width;
            }

            y = this.mouseClickY - 357;
            if (y < 0) {
                y = 0;
            } else if (y + height > 96) {
                y = 96 - height;
            }

            this.menuVisible = true;
            this.menuArea = 2;
            this.menuX = x;
            this.menuY = y;
            this.menuWidth = width;
            this.menuHeight = this.menuSize * 15 + 22;
        }
    }

    private isAddFriendOption(option: number): boolean {
        if (option < 0) {
            return false;
        }

        let action: number = this.menuAction[option];
        if (action >= MenuAction._PRIORITY) {
            action -= MenuAction._PRIORITY;
        }

        return action === MenuAction.FRIENDLIST_ADD;
    }

    private useMenuOption(optionId: number): void {
        if (optionId < 0) {
            return;
        }

        if (this.dialogInputOpen) {
            this.dialogInputOpen = false;
            this.redrawChatback = true;
        }

        let action: number = this.menuAction[optionId];
        const a: number = this.menuParamA[optionId];
        const b: number = this.menuParamB[optionId];
        const c: number = this.menuParamC[optionId];
        
        if (this.logUseMenu) {
            console.log(`Using menu item ${optionId} with action=${action}, a=${a}, b=${b}, c=${c}`);
        }

        if (action >= MenuAction._PRIORITY) {
            action -= MenuAction._PRIORITY;
        }

        if (action === MenuAction.OPOBJ1 || action === MenuAction.OPOBJ2 || action === MenuAction.OPOBJ3 || action === MenuAction.OPOBJ4 || action === MenuAction.OPOBJ5) {
            if (this.localPlayer) {
                const success: boolean = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
                if (!success) {
                    this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
                }

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                if (action === MenuAction.OPOBJ1) {
                    if ((b & 0x3) == 0) {
                        Client.oplogic7++;
                    }
                    if (Client.oplogic7 >= 123) {
                        this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC7);
                        this.out.p4(0);
                    }

                    this.out.pIsaac(ClientProt.OPOBJ1);
                }

                if (action === MenuAction.OPOBJ2) {
                    this.out.pIsaac(ClientProt.OPOBJ2);
                }

                if (action === MenuAction.OPOBJ3) {
                    this.out.pIsaac(ClientProt.OPOBJ3);
                }

                if (action === MenuAction.OPOBJ4) {
                    Client.oplogic8 += c;
                    if (Client.oplogic8 >= 75) {
                        this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC8);
                        this.out.p1(19);
                    }

                    this.out.pIsaac(ClientProt.OPOBJ4);
                }

                if (action === MenuAction.OPOBJ5) {
                    Client.oplogic3 += this.mapBuildBaseZ;
                    if (Client.oplogic3 >= 118) {
                        this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC3);
                        this.out.p4(0);
                    }

                    this.out.pIsaac(ClientProt.OPOBJ5);
                }

                this.out.p2(b + this.mapBuildBaseX);
                this.out.p2(c + this.mapBuildBaseZ);
                this.out.p2(a);
            }
        }

        if (action === MenuAction.OPOBJ6) {
            const obj: ObjType = ObjType.get(a);
            let examine: string;

            if (!obj.desc) {
                examine = "It's a " + obj.name + '.';
            } else {
                examine = obj.desc;
            }

            this.addChat(0, examine, '');
        }

        if (action === MenuAction.OPOBJT) {
            if (this.localPlayer) {
                const success: boolean = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
                if (!success) {
                    this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
                }

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPOBJT);
                this.out.p2(b + this.mapBuildBaseX);
                this.out.p2(c + this.mapBuildBaseZ);
                this.out.p2(a);
                this.out.p2(this.activeSpellId);
            }
        }

        if (action === MenuAction.OPOBJU) {
            if (this.localPlayer) {
                const success: boolean = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
                if (!success) {
                    this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
                }

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPOBJU);
                this.out.p2(b + this.mapBuildBaseX);
                this.out.p2(c + this.mapBuildBaseZ);
                this.out.p2(a);
                this.out.p2(this.objLayerId);
                this.out.p2(this.objSelectedSlot);
                this.out.p2(this.objSelectedLayerId);
            }
        }

        if (action === MenuAction.OPNPC1 || action === MenuAction.OPNPC2 || action === MenuAction.OPNPC3 || action === MenuAction.OPNPC4 || action === MenuAction.OPNPC5) {
            const npc: ClientNpc | null = this.npc[a];
            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                if (action === MenuAction.OPNPC1) {
                    this.out.pIsaac(ClientProt.OPNPC1);
                }

                if (action === MenuAction.OPNPC2) {
                    this.out.pIsaac(ClientProt.OPNPC2);
                }

                if (action === MenuAction.OPNPC3) {
                    this.out.pIsaac(ClientProt.OPNPC3);
                }

                if (action === MenuAction.OPNPC4) {
                    this.out.pIsaac(ClientProt.OPNPC4);
                }

                if (action === MenuAction.OPNPC5) {
                    this.out.pIsaac(ClientProt.OPNPC5);
                }

                this.out.p2(a);
            }
        }

        if (action === MenuAction.OPNPC6) {
            const npc: ClientNpc | null = this.npc[a];
            if (npc && npc.type) {
                let examine: string;

                if (!npc.type.desc) {
                    examine = "It's a " + npc.type.name + '.';
                } else {
                    examine = npc.type.desc;
                }

                this.addChat(0, examine, '');
            }
        }

        if (action === MenuAction.OPNPCT) {
            const npc: ClientNpc | null = this.npc[a];
            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPNPCT);
                this.out.p2(a);
                this.out.p2(this.activeSpellId);
            }
        }

        if (action === MenuAction.OPNPCU) {
            const npc: ClientNpc | null = this.npc[a];

            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPNPCU);
                this.out.p2(a);
                this.out.p2(this.objLayerId);
                this.out.p2(this.objSelectedSlot);
                this.out.p2(this.objSelectedLayerId);
            }
        }

        if (action === MenuAction.OPLOC1) {
            this.interactWithLoc(ClientProt.OPLOC1, b, c, a);
        }

        if (action === MenuAction.OPLOC2) {
            Client.oplogic1 += c;
            if (Client.oplogic1 >= 139) {
                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC1);
                this.out.p4(0);
            }

            this.interactWithLoc(ClientProt.OPLOC2, b, c, a);
        }

        if (action === MenuAction.OPLOC3) {
            Client.oplogic2++;
            if (Client.oplogic2 >= 124) {
                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC2);
                this.out.p2(37954);
            }

            this.interactWithLoc(ClientProt.OPLOC3, b, c, a);
        }

        if (action === MenuAction.OPLOC4) {
            this.interactWithLoc(ClientProt.OPLOC4, b, c, a);
        }

        if (action === MenuAction.OPLOC5) {
            this.interactWithLoc(ClientProt.OPLOC5, b, c, a);
        }

        if (action === MenuAction.OPLOC6) {
            const locId: number = (a >> 14) & 0x7fff;
            const loc: LocType = LocType.get(locId);

            let examine: string;
            if (!loc.desc) {
                examine = "It's a " + loc.name + '.';
            } else {
                examine = loc.desc;
            }

            this.addChat(0, examine, '');
        }

        if (action === MenuAction.OPLOCT) {
            if (this.interactWithLoc(ClientProt.OPLOCT, b, c, a)) {
                this.out.p2(this.activeSpellId);
            }
        }

        if (action === MenuAction.OPLOCU) {
            if (this.interactWithLoc(ClientProt.OPLOCU, b, c, a)) {
                this.out.p2(this.objLayerId);
                this.out.p2(this.objSelectedSlot);
                this.out.p2(this.objSelectedLayerId);
            }
        }

        if (action === MenuAction.OPPLAYER1 || action === MenuAction.OPPLAYER2 || action === MenuAction.OPPLAYER3 || action === MenuAction.OPPLAYER4 || action === MenuAction.OPPLAYER5) {
            const player: ClientPlayer | null = this.players[a];
            if (player && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                if (action === MenuAction.OPPLAYER1) {
                    Client.oplogic4++;
                    if (Client.oplogic4 >= 52) {
                        this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC4);
                        this.out.p1(131);
                    }

                    this.out.pIsaac(ClientProt.OPPLAYER1);
                }

                if (action === MenuAction.OPPLAYER2) {
                    this.out.pIsaac(ClientProt.OPPLAYER2);
                }

                if (action === MenuAction.OPPLAYER3) {
                    this.out.pIsaac(ClientProt.OPPLAYER3);
                }

                if (action === MenuAction.OPPLAYER4) {
                    Client.oplogic5 += a;
                    if (Client.oplogic5 >= 66) {
                        this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC5);
                        this.out.p1(154);
                    }

                    this.out.pIsaac(ClientProt.OPPLAYER4);
                }

                if (action === MenuAction.OPPLAYER5) {
                    this.out.pIsaac(ClientProt.OPPLAYER5);
                }

                this.out.p2(a);
            }
        }

        if (action === MenuAction.OPPLAYER_TRADEREQ || action === MenuAction.OPPLAYER_DUELREQ) {
            let option: string = this.menuOption[optionId];
            const tag: number = option.indexOf('@whi@');

            if (tag !== -1) {
                option = option.substring(tag + 5).trim();
                const name: string = JString.formatName(JString.fromBase37(JString.toBase37(option)));
                let found: boolean = false;

                for (let i: number = 0; i < this.playerCount; i++) {
                    const player: ClientPlayer | null = this.players[this.playerIds[i]];

                    if (player && player.name && player.name.toLowerCase() === name.toLowerCase() && this.localPlayer) {
                        this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                        if (action === MenuAction.OPPLAYER_TRADEREQ) {
                            Client.oplogic5 += a;
                            if (Client.oplogic5 >= 66) {
                                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC5);
                                this.out.p1(154);
                            }

                            this.out.pIsaac(ClientProt.OPPLAYER4);
                        }

                        if (action === MenuAction.OPPLAYER_DUELREQ) {
                            Client.oplogic4++;
                            if (Client.oplogic4 >= 52) {
                                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC4);
                                this.out.p1(131);
                            }

                            this.out.pIsaac(ClientProt.OPPLAYER1);
                        }

                        this.out.p2(this.playerIds[i]);
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    this.addChat(0, 'Unable to find ' + name, '');
                }
            }
        }

        if (action === MenuAction.OPPLAYERT) {
            const player: ClientPlayer | null = this.players[a];

            if (player && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPPLAYERT);
                this.out.p2(a);
                this.out.p2(this.activeSpellId);
            }
        }

        if (action === MenuAction.OPPLAYERU) {
            const player: ClientPlayer | null = this.players[a];
            if (player && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], player.routeX[0], player.routeZ[0], 2, 1, 1, 0, 0, 0, false);

                this.crossX = this.mouseClickX;
                this.crossY = this.mouseClickY;
                this.crossMode = 2;
                this.crossCycle = 0;

                this.out.pIsaac(ClientProt.OPPLAYERU);
                this.out.p2(a);
                this.out.p2(this.objLayerId);
                this.out.p2(this.objSelectedSlot);
                this.out.p2(this.objSelectedLayerId);
            }
        }

        if (action === MenuAction.OPHELD1 || action === MenuAction.OPHELD2 || action === MenuAction.OPHELD3 || action === MenuAction.OPHELD4 || action === MenuAction.OPHELD5) {
            if (action === MenuAction.OPHELD1) {
                this.out.pIsaac(ClientProt.OPHELD1);
            }

            if (action === MenuAction.OPHELD2) {
                this.out.pIsaac(ClientProt.OPHELD2);
            }

            if (action === MenuAction.OPHELD3) {
                this.out.pIsaac(ClientProt.OPHELD3);
            }

            if (action === MenuAction.OPHELD4) {
                Client.oplogic9++;
                if (Client.oplogic9 >= 116) {
                    this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC9);
                    this.out.p3(13018169);
                }

                this.out.pIsaac(ClientProt.OPHELD4);
            }

            if (action === MenuAction.OPHELD5) {
                this.out.pIsaac(ClientProt.OPHELD5);
            }

            this.out.p2(a);
            this.out.p2(b);
            this.out.p2(c);

            this.selectedCycle = 0;
            this.selectedLayerId = c;
            this.selectedItem = b;
            this.selectedArea = 2;

            if (IfType.list[c].layerId === this.mainLayerId) {
                this.selectedArea = 1;
            }

            if (IfType.list[c].layerId === this.chatLayerId) {
                this.selectedArea = 3;
            }
        }

        if (action === MenuAction.OPHELD6) {
            const obj: ObjType = ObjType.get(a);
            let examine: string;

            if (c >= 100000) {
                examine = c + ' x ' + obj.name;
            } else if (!obj.desc) {
                examine = "It's a " + obj.name + '.';
            } else {
                examine = obj.desc;
            }

            this.addChat(0, examine, '');
        }

        if (action === MenuAction.OPHELDT_START) {
            this.objSelected = 1;
            this.objSelectedSlot = b;
            this.objSelectedLayerId = c;
            this.objLayerId = a;
            this.objSelectedName = ObjType.get(a).name;
            this.spellSelected = 0;
            this.redrawSidebar = true;
            return;
        }

        if (action === MenuAction.OPHELDT_SELECT) {
            const com: IfType = IfType.list[c];
            this.spellSelected = 1;
            this.activeSpellId = c;
            this.activeSpellFlags = com.targetMask;
            this.objSelected = 0;
            this.redrawSidebar = true;

            let prefix: string | null = com.targetVerb;
            if (prefix && prefix.indexOf(' ') !== -1) {
                prefix = prefix.substring(0, prefix.indexOf(' '));
            }

            let suffix: string | null = com.targetVerb;
            if (suffix && suffix.indexOf(' ') !== -1) {
                suffix = suffix.substring(suffix.indexOf(' ') + 1);
            }

            this.spellCaption = prefix + ' ' + com.targetText + ' ' + suffix;

            if (this.activeSpellFlags === 0x10) {
                this.redrawSidebar = true;
                this.sideTab = 3;
                this.redrawSideicons = true;
            }

            return;
        }

        if (action === MenuAction.OPHELDT) {
            this.out.pIsaac(ClientProt.OPHELDT);
            this.out.p2(a);
            this.out.p2(b);
            this.out.p2(c);
            this.out.p2(this.activeSpellId);

            this.selectedCycle = 0;
            this.selectedLayerId = c;
            this.selectedItem = b;
            this.selectedArea = 2;

            if (IfType.list[c].layerId === this.mainLayerId) {
                this.selectedArea = 1;
            }

            if (IfType.list[c].layerId === this.chatLayerId) {
                this.selectedArea = 3;
            }
        }

        if (action === MenuAction.OPHELDU) {
            this.out.pIsaac(ClientProt.OPHELDU);
            this.out.p2(a);
            this.out.p2(b);
            this.out.p2(c);
            this.out.p2(this.objLayerId);
            this.out.p2(this.objSelectedSlot);
            this.out.p2(this.objSelectedLayerId);

            this.selectedCycle = 0;
            this.selectedLayerId = c;
            this.selectedItem = b;
            this.selectedArea = 2;

            if (IfType.list[c].layerId === this.mainLayerId) {
                this.selectedArea = 1;
            }

            if (IfType.list[c].layerId === this.chatLayerId) {
                this.selectedArea = 3;
            }
        }

        if (action === MenuAction.INV_BUTTON1 || action === MenuAction.INV_BUTTON2 || action === MenuAction.INV_BUTTON3 || action === MenuAction.INV_BUTTON4 || action === MenuAction.INV_BUTTON5) {
            if (action === MenuAction.INV_BUTTON1) {
                if ((a & 0x3) == 0) {
                    Client.oplogic6++;
                }
                if (Client.oplogic6 >= 133) {
                    this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC6);
                    this.out.p2(6118);
                }

                this.out.pIsaac(ClientProt.INV_BUTTON1);
            }

            if (action === MenuAction.INV_BUTTON2) {
                this.out.pIsaac(ClientProt.INV_BUTTON2);
            }

            if (action === MenuAction.INV_BUTTON3) {
                this.out.pIsaac(ClientProt.INV_BUTTON3);
            }

            if (action === MenuAction.INV_BUTTON4) {
                this.out.pIsaac(ClientProt.INV_BUTTON4);
            }

            if (action === MenuAction.INV_BUTTON5) {
                this.out.pIsaac(ClientProt.INV_BUTTON5);
            }

            this.out.p2(a);
            this.out.p2(b);
            this.out.p2(c);

            this.selectedCycle = 0;
            this.selectedLayerId = c;
            this.selectedItem = b;
            this.selectedArea = 2;

            if (IfType.list[c].layerId === this.mainLayerId) {
                this.selectedArea = 1;
            }

            if (IfType.list[c].layerId === this.chatLayerId) {
                this.selectedArea = 3;
            }
        }

        if (action === MenuAction.IF_BUTTON) {
            const com: IfType = IfType.list[c];
            let notify: boolean = true;

            if (com.clientCode > 0) {
                notify = this.handleInterfaceAction(com);
            }

            if (notify) {
                this.out.pIsaac(ClientProt.IF_BUTTON);
                this.out.p2(c);
            }
        }

        if (action === MenuAction.IF_BUTTON_TOGGLE) {
            this.out.pIsaac(ClientProt.IF_BUTTON);
            this.out.p2(c);

            const com: IfType = IfType.list[c];
            if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
                const varp: number = com.scripts[0][1];
                this.var[varp] = 1 - this.var[varp];
                this.updateVarp(varp);
                this.redrawSidebar = true;
            }
        }

        if (action === MenuAction.IF_BUTTON_SELECT) {
            this.out.pIsaac(ClientProt.IF_BUTTON);
            this.out.p2(c);

            const com: IfType = IfType.list[c];
            if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
                const varp: number = com.scripts[0][1];
                if (com.scriptOperand && this.var[varp] !== com.scriptOperand[0]) {
                    this.var[varp] = com.scriptOperand[0];
                    this.updateVarp(varp);
                    this.redrawSidebar = true;
                }
            }
        }

        if (action === MenuAction.RESUME_PAUSEBUTTON) {
            if (!this.resumedPauseButton) {
                this.out.pIsaac(ClientProt.RESUME_PAUSEBUTTON);
                this.out.p2(c);
                this.resumedPauseButton = true;
            }
        }

        if (action === MenuAction.CLOSE_MODAL) {
            this.closeModal();
        }

        if (action === MenuAction.REPORT_ABUSE) {
            const option: string = this.menuOption[optionId];
            const tag: number = option.indexOf('@whi@');

            if (tag !== -1) {
                this.closeModal();

                this.reportAbuseInput = option.substring(tag + 5).trim();
                this.reportAbuseMuteOption = false;

                for (let i: number = 0; i < IfType.list.length; i++) {
                    if (IfType.list[i] && IfType.list[i].clientCode === ClientCode.CC_REPORT_INPUT) {
                        this.reportAbuseLayerId = this.mainLayerId = IfType.list[i].layerId;
                        break;
                    }
                }
            }
        }

        if (action === MenuAction.WALK) {
            if (this.menuVisible) {
                this.world?.updateMousePicking(b - 4, c - 4);
            } else {
                this.world?.updateMousePicking(this.mouseClickX - 4, this.mouseClickY - 4);
            }
        }

        if (action === MenuAction.FRIENDLIST_ADD || action === MenuAction.IGNORELIST_ADD || action === MenuAction.FRIENDLIST_DEL || action === MenuAction.IGNORELIST_DEL) {
            const option: string = this.menuOption[optionId];
            const tag: number = option.indexOf('@whi@');

            if (tag !== -1) {
                const username: bigint = JString.toBase37(option.substring(tag + 5).trim());
                if (action === MenuAction.FRIENDLIST_ADD) {
                    this.addFriend(username);
                } else if (action === MenuAction.IGNORELIST_ADD) {
                    this.addIgnore(username);
                } else if (action === MenuAction.FRIENDLIST_DEL) {
                    this.delFriend(username);
                } else if (action === MenuAction.IGNORELIST_DEL) {
                    this.delIgnore(username);
                }
            }
        }

        if (action === MenuAction.MESSAGE_PRIVATE) {
            const option: string = this.menuOption[optionId];
            const tag: number = option.indexOf('@whi@');

            if (tag !== -1) {
                const name37: bigint = JString.toBase37(option.substring(tag + 5).trim());
                let friend: number = -1;

                for (let i: number = 0; i < this.friendCount; i++) {
                    if (this.friendName37[i] === name37) {
                        friend = i;
                        break;
                    }
                }

                if (friend !== -1 && this.friendWorld[friend] > 0) {
                    this.redrawChatback = true;
                    this.dialogInputOpen = false;
                    this.socialInputOpen = true;
                    this.socialInput = '';
                    this.socialInputType = 3;
                    this.socialName37 = this.friendName37[friend];
                    this.socialMessage = 'Enter message to send to ' + this.friendName[friend];
                }
            }
        }

        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    // jag::oldscape::minimenu::Minimenu::AddNpcOptions
    private addNpcOptions(npc: NpcType, a: number, b: number, c: number): void {
        if (this.menuSize >= 400) {
            return;
        }

        let tooltip: string | null = npc.name;
        if (npc.vislevel !== 0 && this.localPlayer) {
            tooltip = tooltip + this.combatColourCode(this.localPlayer.combatLevel, npc.vislevel) + ' (level-' + npc.vislevel + ')';
        }

        if (this.objSelected === 1) {
            this.menuOption[this.menuSize] = 'Use ' + this.objSelectedName + ' with @yel@' + tooltip;
            this.menuAction[this.menuSize] = MenuAction.OPNPCU;
            this.menuParamA[this.menuSize] = a;
            this.menuParamB[this.menuSize] = b;
            this.menuParamC[this.menuSize] = c;
            this.menuSize++;
        } else if (this.spellSelected !== 1) {
            let type: number;
            if (npc.op) {
                for (type = 4; type >= 0; type--) {
                    if (npc.op[type] && npc.op[type]?.toLowerCase() !== 'attack') {
                        this.menuOption[this.menuSize] = npc.op[type] + ' @yel@' + tooltip;

                        if (type === 0) {
                            this.menuAction[this.menuSize] = MenuAction.OPNPC1;
                        } else if (type === 1) {
                            this.menuAction[this.menuSize] = MenuAction.OPNPC2;
                        } else if (type === 2) {
                            this.menuAction[this.menuSize] = MenuAction.OPNPC3;
                        } else if (type === 3) {
                            this.menuAction[this.menuSize] = MenuAction.OPNPC4;
                        } else if (type === 4) {
                            this.menuAction[this.menuSize] = MenuAction.OPNPC5;
                        }

                        this.menuParamA[this.menuSize] = a;
                        this.menuParamB[this.menuSize] = b;
                        this.menuParamC[this.menuSize] = c;
                        this.menuSize++;
                    }
                }
            }

            if (npc.op) {
                for (type = 4; type >= 0; type--) {
                    if (npc.op[type] && npc.op[type]?.toLowerCase() === 'attack') {
                        let priority: number = 0;
                        if (this.localPlayer && npc.vislevel > this.localPlayer.combatLevel) {
                            priority = MenuAction._PRIORITY;
                        }

                        this.menuOption[this.menuSize] = npc.op[type] + ' @yel@' + tooltip;

                        if (type === 0) {
                            this.menuAction[this.menuSize] = priority + MenuAction.OPNPC1;
                        } else if (type === 1) {
                            this.menuAction[this.menuSize] = priority + MenuAction.OPNPC2;
                        } else if (type === 2) {
                            this.menuAction[this.menuSize] = priority + MenuAction.OPNPC3;
                        } else if (type === 3) {
                            this.menuAction[this.menuSize] = priority + MenuAction.OPNPC4;
                        } else if (type === 4) {
                            this.menuAction[this.menuSize] = priority + MenuAction.OPNPC5;
                        }

                        this.menuParamA[this.menuSize] = a;
                        this.menuParamB[this.menuSize] = b;
                        this.menuParamC[this.menuSize] = c;
                        this.menuSize++;
                    }
                }
            }

            this.menuOption[this.menuSize] = 'Examine @yel@' + tooltip;
            this.menuAction[this.menuSize] = MenuAction.OPNPC6;
            this.menuParamA[this.menuSize] = a;
            this.menuParamB[this.menuSize] = b;
            this.menuParamC[this.menuSize] = c;
            this.menuSize++;
        } else if ((this.activeSpellFlags & 0x2) === 2) {
            this.menuOption[this.menuSize] = this.spellCaption + ' @yel@' + tooltip;
            this.menuAction[this.menuSize] = MenuAction.OPNPCT;
            this.menuParamA[this.menuSize] = a;
            this.menuParamB[this.menuSize] = b;
            this.menuParamC[this.menuSize] = c;
            this.menuSize++;
        }
    }

    // jag::oldscape::minimenu::Minimenu::AddPlayerOptions
    private addPlayerOptions(player: ClientPlayer, a: number, b: number, c: number): void {
        if (player === this.localPlayer || this.menuSize >= 400) {
            return;
        }

        let tooltip: string | null = null;
        if (this.localPlayer) {
            tooltip = player.name + this.combatColourCode(this.localPlayer.combatLevel, player.combatLevel) + ' (level-' + player.combatLevel + ')';
        }

        if (this.objSelected === 1) {
            this.menuOption[this.menuSize] = 'Use ' + this.objSelectedName + ' with @whi@' + tooltip;
            this.menuAction[this.menuSize] = MenuAction.OPPLAYERU;
            this.menuParamA[this.menuSize] = a;
            this.menuParamB[this.menuSize] = b;
            this.menuParamC[this.menuSize] = c;
            this.menuSize++;
        } else if (this.spellSelected === 1) {
            if ((this.activeSpellFlags & 0x8) === 8) {
                this.menuOption[this.menuSize] = this.spellCaption + ' @whi@' + tooltip;
                this.menuAction[this.menuSize] = MenuAction.OPPLAYERT;
                this.menuParamA[this.menuSize] = a;
                this.menuParamB[this.menuSize] = b;
                this.menuParamC[this.menuSize] = c;
                this.menuSize++;
            }
        } else {
            for (let i = 4; i >= 0; i--) {
                const op = this.playerOp[i];
                if (op === null || !this.localPlayer) {
                    continue;
                }

                this.menuOption[this.menuSize] = op + ' @whi@' + tooltip;

                let priority = 0;
                if (op.toLowerCase() === 'attack') {
                    if (player.combatLevel > this.localPlayer.combatLevel) {
                        priority = 2000;
                    }
                } else if (this.playerOpPriority[i]) {
                    priority = 2000;
                }

                if (i === 0) {
                    this.menuAction[this.menuSize] = priority + MenuAction.OPPLAYER1;
                } else if (i === 1) {
                    this.menuAction[this.menuSize] = priority + MenuAction.OPPLAYER2;
                } else if (i === 2) {
                    this.menuAction[this.menuSize] = priority + MenuAction.OPPLAYER3;
                } else if (i === 3) {
                    this.menuAction[this.menuSize] = priority + MenuAction.OPPLAYER4;
                } else if (i === 4) {
                    this.menuAction[this.menuSize] = priority + MenuAction.OPPLAYER5;
                }

                this.menuParamA[this.menuSize] = a;
                this.menuParamB[this.menuSize] = b;
                this.menuParamC[this.menuSize] = c;
                this.menuSize++;
            }
        }

        for (let i: number = 0; i < this.menuSize; i++) {
            if (this.menuAction[i] === MenuAction.WALK) {
                this.menuOption[i] = 'Walk here @whi@' + tooltip;
                break;
            }
        }
    }

    // jag::oldscape::minimenu::Minimenu::CombatColourCode
    private combatColourCode(viewerLevel: number, otherLevel: number): string {
        const diff: number = viewerLevel - otherLevel;
        if (diff < -9) {
            return '@red@';
        } else if (diff < -6) {
            return '@or3@';
        } else if (diff < -3) {
            return '@or2@';
        } else if (diff < 0) {
            return '@or1@';
        } else if (diff > 9) {
            return '@gre@';
        } else if (diff > 6) {
            return '@gr3@';
        } else if (diff > 3) {
            return '@gr2@';
        } else if (diff > 0) {
            return '@gr1@';
        } else {
            return '@yel@';
        }
    }

    private drawLayer(com: IfType, x: number, y: number, scrollY: number): void {
        if (com.type !== 0 || !com.children || (com.hidden && this.overMainLayerId !== com.id && this.overSideLayerId !== com.id && this.overChatLayerId !== com.id)) {
            return;
        }

        const left: number = Pix2D.left;
        const top: number = Pix2D.top;
        const right: number = Pix2D.right;
        const bottom: number = Pix2D.bottom;

        Pix2D.setClipping(x, y, x + com.width, y + com.height);
        const children: number = com.children.length;

        for (let i: number = 0; i < children; i++) {
            if (!com.childX || !com.childY) {
                continue;
            }

            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollY;

            const child: IfType = IfType.list[com.children[i]];
            childX += child.x;
            childY += child.y;

            if (child.clientCode > 0) {
                this.updateInterfaceContent(child);
            }

            if (child.type === ComponentType.TYPE_LAYER) {
                if (child.scrollPos > child.scrollSize - child.height) {
                    child.scrollPos = child.scrollSize - child.height;
                }

                if (child.scrollPos < 0) {
                    child.scrollPos = 0;
                }

                this.drawLayer(child, childX, childY, child.scrollPos);

                if (child.scrollSize > child.height) {
                    this.drawScrollbar(childX + child.width, childY, child.scrollPos, child.scrollSize, child.height);
                }
            } else if (child.type === ComponentType.TYPE_INV) {
                let slot: number = 0;

                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (!child.invSlotOffsetX || !child.invSlotOffsetY || !child.linkObjType || !child.linkObjCount) {
                            continue;
                        }

                        let slotX: number = childX + col * (child.marginX + 32);
                        let slotY: number = childY + row * (child.marginY + 32);

                        if (slot < 20) {
                            slotX += child.invSlotOffsetX[slot];
                            slotY += child.invSlotOffsetY[slot];
                        }

                        if (child.linkObjType[slot] > 0) {
                            let dx: number = 0;
                            let dy: number = 0;
                            const id: number = child.linkObjType[slot] - 1;

                            if ((slotX > Pix2D.left - 32 && slotX < Pix2D.right && slotY > Pix2D.top - 32 && slotY < Pix2D.bottom) || (this.objDragArea !== 0 && this.objDragSlot === slot)) {
                                let outline = 0;
                                if (this.objSelected == 1 && this.objSelectedSlot == slot && this.objSelectedLayerId == child.id) {
                                    outline = 16777215;
                                }

                                const icon: Pix32 | null = ObjType.getSprite(id, child.linkObjCount[slot], outline);
                                if (icon) {
                                    if (this.objDragArea !== 0 && this.objDragSlot === slot && this.objDragLayerId === child.id) {
                                        dx = this.mouseX - this.objGrabX;
                                        dy = this.mouseY - this.objGrabY;

                                        if (dx < 5 && dx > -5) {
                                            dx = 0;
                                        }

                                        if (dy < 5 && dy > -5) {
                                            dy = 0;
                                        }

                                        if (this.objDragCycles < 5) {
                                            dx = 0;
                                            dy = 0;
                                        }

                                        icon.transPlotSprite(128, slotX + dx, slotY + dy);

                                        if (slotY + dy < Pix2D.top && com.scrollPos > 0) {
                                            let autoscroll = (Pix2D.top - slotY - dy) * this.sceneDelta / 3;
                                            if (autoscroll > this.sceneDelta * 10) {
                                                autoscroll = this.sceneDelta * 10;
                                            }

                                            if (autoscroll > com.scrollPos) {
                                                autoscroll = com.scrollPos;
                                            }

                                            com.scrollPos -= autoscroll;
                                            this.objGrabY += autoscroll;
                                        }

                                        if (slotY + dy + 32 > Pix2D.bottom && com.scrollPos < com.scrollSize - com.height) {
                                            let autoscroll = (slotY + dy + 32 - Pix2D.bottom) * this.sceneDelta / 3;
                                            if (autoscroll > this.sceneDelta * 10) {
                                                autoscroll = this.sceneDelta * 10;
                                            }

                                            if (autoscroll > com.scrollSize - com.height - com.scrollPos) {
                                                autoscroll = com.scrollSize - com.height - com.scrollPos;
                                            }

                                            com.scrollPos += autoscroll;
                                            this.objGrabY -= autoscroll;
                                        }
                                    } else if (this.selectedArea !== 0 && this.selectedItem === slot && this.selectedLayerId === child.id) {
                                        icon.transPlotSprite(128, slotX, slotY);
                                    } else {
                                        icon.plotSprite(slotX, slotY);
                                    }

                                    if (icon.owi === 33 || child.linkObjCount[slot] !== 1) {
                                        const count: number = child.linkObjCount[slot];
                                        this.fontPlain11?.drawString(slotX + dx + 1, slotY + 10 + dy, this.formatObjCount(count), Colour.BLACK);
                                        this.fontPlain11?.drawString(slotX + dx, slotY + 9 + dy, this.formatObjCount(count), Colour.YELLOW);
                                    }
                                }
                            }
                        } else if (child.invSlotGraphic && slot < 20) {
                            const image: Pix32 | null = child.invSlotGraphic[slot];
                            image?.plotSprite(slotX, slotY);
                        }

                        slot++;
                    }
                }
            } else if (child.type === ComponentType.TYPE_RECT) {
                let hovered: boolean = false;
                if (this.overChatLayerId === child.id || this.overSideLayerId === child.id || this.overMainLayerId === child.id) {
                    hovered = true;
                }

                let colour: number = 0;
                if (this.getIfActive(child)) {
                    colour = child.colour2;

                    if (hovered && child.colour2Over !== 0) {
                        colour = child.colour2Over;
                    }
                } else {
                    colour = child.colour;

                    if (hovered && child.colourOver !== 0) {
                        colour = child.colourOver;
                    }
                }

                if (child.transparency === 0) {
                    if (child.fill) {
                        Pix2D.fillRect(childX, childY, child.width, child.height, colour);
                    } else {
                        Pix2D.drawRect(childX, childY, child.width, child.height, colour);
                    }
                } else if (child.fill) {
                    Pix2D.fillRectTrans(childX, childY, child.width, child.height, colour, 256 - (child.transparency & 0xFF));
                } else {
                    Pix2D.drawRect(childX, childY, child.width, child.height, colour);
                    Pix2D.drawRectTrans(childX, childY, child.width, child.height, colour, 256 - (child.transparency & 0xFF));
                }
            } else if (child.type === ComponentType.TYPE_TEXT) {
                const font: PixFont | null = child.font;
                let text: string | null = child.text;

                let hovered: boolean = false;
                if (this.overChatLayerId === child.id || this.overSideLayerId === child.id || this.overMainLayerId === child.id) {
                    hovered = true;
                }

                let colour: number = 0;
                if (this.getIfActive(child)) {
                    colour = child.colour2;

                    if (hovered && child.colour2Over !== 0) {
                        colour = child.colour2Over;
                    }

                    if (child.text2 && child.text2.length > 0) {
                        text = child.text2;
                    }
                } else {
                    colour = child.colour;

                    if (hovered && child.colourOver !== 0) {
                        colour = child.colourOver;
                    }
                }

                if (child.buttonType === ButtonType.BUTTON_CONTINUE && this.resumedPauseButton) {
                    text = 'Please wait...';
                    colour = child.colour;
                }

                if (Pix2D.width == 479) {
                    if (colour == 0xffff00) {
                        colour = 0x0000ff;
                    }

                    if (colour == 0x00c000) {
                        colour = 0xffffff;
                    }
                }

                if (!font || !text) {
                    continue;
                }

                for (let lineY: number = childY + font.height2d; text.length > 0; lineY += font.height2d) {
                    if (text.indexOf('%') !== -1) {
                        do {
                            const index: number = text.indexOf('%1');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.getIfVar(child, 0)) + text.substring(index + 2);
                        } while (true);

                        do {
                            const index: number = text.indexOf('%2');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.getIfVar(child, 1)) + text.substring(index + 2);
                        } while (true);

                        do {
                            const index: number = text.indexOf('%3');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.getIfVar(child, 2)) + text.substring(index + 2);
                        } while (true);

                        do {
                            const index: number = text.indexOf('%4');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.getIfVar(child, 3)) + text.substring(index + 2);
                        } while (true);

                        do {
                            const index: number = text.indexOf('%5');
                            if (index === -1) {
                                break;
                            }

                            text = text.substring(0, index) + this.getIntString(this.getIfVar(child, 4)) + text.substring(index + 2);
                        } while (true);
                    }

                    const newline: number = text.indexOf('\\n');
                    let split: string;
                    if (newline !== -1) {
                        split = text.substring(0, newline);
                        text = text.substring(newline + 2);
                    } else {
                        split = text;
                        text = '';
                    }

                    if (child.center) {
                        font.centreStringTag(childX + ((child.width / 2) | 0), lineY, split, colour, child.shadowed);
                    } else {
                        font.drawStringTag(childX, lineY, split, colour, child.shadowed);
                    }
                }
            } else if (child.type === ComponentType.TYPE_GRAPHIC) {
                let image: Pix32 | null;
                if (this.getIfActive(child)) {
                    image = child.graphic2;
                } else {
                    image = child.graphic;
                }

                image?.plotSprite(childX, childY);
            } else if (child.type === ComponentType.TYPE_MODEL) {
                const tmpX: number = Pix3D.projectionX;
                const tmpY: number = Pix3D.projectionY;

                Pix3D.projectionX = childX + ((child.width / 2) | 0);
                Pix3D.projectionY = childY + ((child.height / 2) | 0);

                const eyeY: number = (Pix3D.sinTable[child.modelXAn] * child.modelZoom) >> 16;
                const eyeZ: number = (Pix3D.cosTable[child.modelXAn] * child.modelZoom) >> 16;

                const active: boolean = this.getIfActive(child);

                let seqId: number;
                if (active) {
                    seqId = child.model2Anim;
                } else {
                    seqId = child.modelAnim;
                }

                let model: Model | null = null;
                if (seqId === -1) {
                    model = child.getTempModel(-1, -1, active, this.localPlayer);
                } else {
                    const seq: SeqType = SeqType.list[seqId];
                    if (seq.frames && seq.iframes) {
                        model = child.getTempModel(seq.frames[child.animFrame], seq.iframes[child.animFrame], active, this.localPlayer);
                    }
                }

                if (model) {
                    model.objRender(0, child.modelYAn, 0, child.modelXAn, 0, eyeY, eyeZ);
                }

                Pix3D.projectionX = tmpX;
                Pix3D.projectionY = tmpY;
            } else if (child.type === ComponentType.TYPE_INV_TEXT) {
                const font: PixFont | null = child.font;
                if (!font || !child.linkObjType || !child.linkObjCount) {
                    continue;
                }

                let slot: number = 0;
                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        if (child.linkObjType[slot] > 0) {
                            const obj: ObjType = ObjType.get(child.linkObjType[slot] - 1);
                            let text: string | null = obj.name;
                            if (obj.stackable || child.linkObjCount[slot] !== 1) {
                                text = text + ' x' + this.formatObjCountTagged(child.linkObjCount[slot]);
                            }

                            if (!text) {
                                continue;
                            }

                            const textX: number = childX + col * (child.marginX + 115);
                            const textY: number = childY + row * (child.marginY + 12);

                            if (child.center) {
                                font.centreStringTag(textX + ((child.width / 2) | 0), textY, text, child.colour, child.shadowed);
                            } else {
                                font.drawStringTag(textX, textY, text, child.colour, child.shadowed);
                            }
                        }

                        slot++;
                    }
                }
            }
        }

        Pix2D.setClipping(left, top, right, bottom);
    }

    // jag::oldscape::Client::DrawScrollbar
    private drawScrollbar(x: number, y: number, scrollY: number, scrollHeight: number, height: number): void {
        this.scrollbar1?.plotSprite(x, y);
        this.scrollbar2?.plotSprite(x, y + height - 16);
        Pix2D.fillRect(x, y + 16, 16, height - 32, this.SCROLLBAR_TRACK);

        let gripSize: number = (((height - 32) * height) / scrollHeight) | 0;
        if (gripSize < 8) {
            gripSize = 8;
        }

        const gripY: number = (((height - gripSize - 32) * scrollY) / (scrollHeight - height)) | 0;
        Pix2D.fillRect(x, y + gripY + 16, 16, gripSize, this.SCROLLBAR_GRIP_FOREGROUND);

        Pix2D.vline(x, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);
        Pix2D.vline(x + 1, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, gripSize);

        Pix2D.hline(x, y + gripY + 16, this.SCROLLBAR_GRIP_HIGHLIGHT, 16);
        Pix2D.hline(x, y + gripY + 17, this.SCROLLBAR_GRIP_HIGHLIGHT, 16);

        Pix2D.vline(x + 15, y + gripY + 16, this.SCROLLBAR_GRIP_LOWLIGHT, gripSize);
        Pix2D.vline(x + 14, y + gripY + 17, this.SCROLLBAR_GRIP_LOWLIGHT, gripSize - 1);

        Pix2D.hline(x, y + gripY + gripSize + 15, this.SCROLLBAR_GRIP_LOWLIGHT, 16);
        Pix2D.hline(x + 1, y + gripY + gripSize + 14, this.SCROLLBAR_GRIP_LOWLIGHT, 15);
    }

    private formatObjCount(amount: number): string {
        if (amount < 100000) {
            return String(amount);
        } else if (amount < 10000000) {
            return ((amount / 1000) | 0) + 'K';
        } else {
            return ((amount / 1000000) | 0) + 'M';
        }
    }

    private formatObjCountTagged(amount: number): string {
        let s: string = String(amount);
        for (let i: number = s.length - 3; i > 0; i -= 3) {
            s = s.substring(0, i) + ',' + s.substring(i);
        }
        if (s.length > 8) {
            s = '@gre@' + s.substring(0, s.length - 8) + ' million @whi@(' + s + ')';
        } else if (s.length > 4) {
            s = '@cya@' + s.substring(0, s.length - 4) + 'K @whi@(' + s + ')';
        }
        return ' ' + s;
    }

    // jag::oldscape::Client::DoScrollbar
    private doScrollbar(mouseX: number, mouseY: number, scrollableHeight: number, height: number, redraw: boolean, left: number, top: number, component: IfType): void {
        if (this.scrollGrabbed) {
            this.scrollInputPadding = 32;
        } else {
            this.scrollInputPadding = 0;
        }

        this.scrollGrabbed = false;

        if (mouseX >= left && mouseX < left + 16 && mouseY >= top && mouseY < top + 16) {
            component.scrollPos -= this.dragCycles * 4;

            if (redraw) {
                this.redrawSidebar = true;
            }
        } else if (mouseX >= left && mouseX < left + 16 && mouseY >= top + height - 16 && mouseY < top + height) {
            component.scrollPos += this.dragCycles * 4;

            if (redraw) {
                this.redrawSidebar = true;
            }
        } else if (mouseX >= left - this.scrollInputPadding && mouseX < left + this.scrollInputPadding + 16 && mouseY >= top + 16 && mouseY < top + height - 16 && this.dragCycles > 0) {
            let gripSize: number = (((height - 32) * height) / scrollableHeight) | 0;
            if (gripSize < 8) {
                gripSize = 8;
            }

            const gripY: number = mouseY - top - ((gripSize / 2) | 0) - 16;
            const maxY: number = height - gripSize - 32;

            component.scrollPos = (((scrollableHeight - height) * gripY) / maxY) | 0;

            if (redraw) {
                this.redrawSidebar = true;
            }

            this.scrollGrabbed = true;
        }
    }

    private getIntString(value: number): string {
        return value < 999999999 ? String(value) : '*';
    }

    // jag::oldscape::Client::GetIfActive
    private getIfActive(com: IfType): boolean {
        if (!com.scriptComparator) {
            return false;
        }

        for (let i: number = 0; i < com.scriptComparator.length; i++) {
            if (!com.scriptOperand) {
                return false;
            }

            const value: number = this.getIfVar(com, i);
            const operand: number = com.scriptOperand[i];

            if (com.scriptComparator[i] === 2) {
                if (value >= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] === 3) {
                if (value <= operand) {
                    return false;
                }
            } else if (com.scriptComparator[i] === 4) {
                if (value === operand) {
                    return false;
                }
            } else if (value !== operand) {
                return false;
            }
        }

        return true;
    }

    // jag::oldscape::Client::GetIfVar
    private getIfVar(component: IfType, scriptId: number): number {
        if (!component.scripts || scriptId >= component.scripts.length) {
            return -2;
        }

        try {
            const script: Uint16Array | null = component.scripts[scriptId];
            if (!script) {
                return -1;
            }

            let acc = 0;
            let pc: number = 0;
            let arithmetic = 0;

            while (true) {
                let register: number = 0;
                let nextArithmetic: number = 0;

                const opcode: number = script[pc++];
                if (opcode === 0) {
                    return acc;
                }

                if (opcode === 1) {
                    // stat_level {skill}
                    register += this.statEffectiveLevel[script[pc++]];
                } else if (opcode === 2) {
                    // stat_base_level {skill}
                    register += this.statBaseLevel[script[pc++]];
                } else if (opcode === 3) {
                    // stat_xp {skill}
                    register += this.statXP[script[pc++]];
                } else if (opcode === 4) {
                    // inv_count {interface id} {obj id}
                    const com: IfType = IfType.list[script[pc++]];
                    const obj: number = script[pc++] + 1;

                    if (com.linkObjType && com.linkObjCount) {
                        for (let i: number = 0; i < com.linkObjType.length; i++) {
                            if (com.linkObjType[i] === obj) {
                                register += com.linkObjCount[i];
                            }
                        }
                    } else {
                        register += 0; // TODO this is custom bcos idk if it can fall 'out of sync' if u dont add to register...
                    }
                } else if (opcode === 5) {
                    // pushvar {id}
                    register += this.var[script[pc++]];
                } else if (opcode === 6) {
                    // stat_xp_remaining {skill}
                    register += Client.levelExperience[this.statBaseLevel[script[pc++]] - 1];
                } else if (opcode === 7) {
                    register += ((this.var[script[pc++]] * 100) / 46875) | 0;
                } else if (opcode === 8) {
                    // combat level
                    register += this.localPlayer?.combatLevel || 0;
                } else if (opcode === 9) {
                    // total level
                    for (let i: number = 0; i < 19; i++) {
                        if (i === 18) {
                            // runecrafting
                            i = 20;
                        }

                        register += this.statBaseLevel[i];
                    }
                } else if (opcode === 10) {
                    // inv_contains {interface id} {obj id}
                    const com: IfType = IfType.list[script[pc++]];
                    const obj: number = script[pc++] + 1;

                    if (com.linkObjType) {
                        for (let i: number = 0; i < com.linkObjType.length; i++) {
                            if (com.linkObjType[i] === obj) {
                                register += 999999999;
                                break;
                            }
                        }
                    }
                } else if (opcode === 11) {
                    // runenergy
                    register += this.runenergy;
                } else if (opcode === 12) {
                    // runweight
                    register += this.runweight;
                } else if (opcode === 13) {
                    // testbit {varp} {bit: 0..31}
                    const varp: number = this.var[script[pc++]];
                    const lsb: number = script[pc++];

                    register += (varp & (0x1 << lsb)) === 0 ? 0 : 1;
                } else if (opcode === 14) {
                    // push_varbit {varbit}
                    const varbit: VarBitType = VarBitType.list[script[pc++]];
                    const { basevar, startbit, endbit } = varbit;

                    const mask = Client.readbit[endbit - startbit];
                    register = (this.var[basevar] >> startbit) & mask;
                } else if (opcode === 15) {
                    // subtract
                    nextArithmetic = 1;
                } else if (opcode === 16) {
                    // divide
                    nextArithmetic = 2;
                } else if (opcode === 17) {
                    // multiply
                    nextArithmetic = 3;
                } else if (opcode === 18) {
                    // coordx
                    if (this.localPlayer) {
                        register = (this.localPlayer.x >> 7) + this.mapBuildBaseX;
                    }
                } else if (opcode === 19) {
                    // coordz
                    if (this.localPlayer) {
                        register = (this.localPlayer.z >> 7) + this.mapBuildBaseZ;
                    }
                } else if (opcode === 20) {
                    // push_constant
                    register = script[pc++];
                }

                if (nextArithmetic === 0) {
                    if (arithmetic === 0) {
                        acc += register;
                    } else if (arithmetic === 1) {
                        acc -= register;
                    } else if (arithmetic === 2 && register !== 0) {
                        acc = (acc / register) | 0;
                    } else if (arithmetic === 3) {
                        acc = (acc * register) | 0;
                    }

                    arithmetic = 0;
                } else {
                    arithmetic = nextArithmetic;
                }
            }
        } catch (_e) {
            return -1;
        }
    }

    // jag::oldscape::minimenu::Minimenu::AddComponent
    private addComponentOptions(com: IfType, mouseX: number, mouseY: number, x: number, y: number, scrollPosition: number): void {
        if (com.type !== 0 || !com.children || com.hidden || mouseX < x || mouseY < y || mouseX > x + com.width || mouseY > y + com.height || !com.childX || !com.childY) {
            return;
        }

        const children: number = com.children.length;
        for (let i: number = 0; i < children; i++) {
            let childX: number = com.childX[i] + x;
            let childY: number = com.childY[i] + y - scrollPosition;
            const child: IfType = IfType.list[com.children[i]];

            childX += child.x;
            childY += child.y;

            if ((child.overlayer >= 0 || child.colourOver !== 0) && mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
                if (child.overlayer >= 0) {
                    this.lastOverLayerId = child.overlayer;
                } else {
                    this.lastOverLayerId = child.id;
                }
            }

            if (child.type === 0) {
                this.addComponentOptions(child, mouseX, mouseY, childX, childY, child.scrollPos);

                if (child.scrollSize > child.height) {
                    this.doScrollbar(mouseX, mouseY, child.scrollSize, child.height, true, childX + child.width, childY, child);
                }
            } else if (child.type === 2) {
                let slot: number = 0;

                for (let row: number = 0; row < child.height; row++) {
                    for (let col: number = 0; col < child.width; col++) {
                        let slotX: number = childX + col * (child.marginX + 32);
                        let slotY: number = childY + row * (child.marginY + 32);

                        if (slot < 20 && child.invSlotOffsetX && child.invSlotOffsetY) {
                            slotX += child.invSlotOffsetX[slot];
                            slotY += child.invSlotOffsetY[slot];
                        }

                        if (mouseX < slotX || mouseY < slotY || mouseX >= slotX + 32 || mouseY >= slotY + 32) {
                            slot++;
                            continue;
                        }

                        this.hoveredSlot = slot;
                        this.hoveredSlotParentId = child.id;

                        if (!child.linkObjType || child.linkObjType[slot] <= 0) {
                            slot++;
                            continue;
                        }

                        const obj: ObjType = ObjType.get(child.linkObjType[slot] - 1);

                        if (this.objSelected === 1 && child.interactable) {
                            if (child.id !== this.objSelectedLayerId || slot !== this.objSelectedSlot) {
                                this.menuOption[this.menuSize] = 'Use ' + this.objSelectedName + ' with @lre@' + obj.name;
                                this.menuAction[this.menuSize] = MenuAction.OPHELDU;
                                this.menuParamA[this.menuSize] = obj.id;
                                this.menuParamB[this.menuSize] = slot;
                                this.menuParamC[this.menuSize] = child.id;
                                this.menuSize++;
                            }
                        } else if (this.spellSelected === 1 && child.interactable) {
                            if ((this.activeSpellFlags & 0x10) === 16) {
                                this.menuOption[this.menuSize] = this.spellCaption + ' @lre@' + obj.name;
                                this.menuAction[this.menuSize] = MenuAction.OPHELDT;
                                this.menuParamA[this.menuSize] = obj.id;
                                this.menuParamB[this.menuSize] = slot;
                                this.menuParamC[this.menuSize] = child.id;
                                this.menuSize++;
                            }
                        } else {
                            if (child.interactable) {
                                for (let op: number = 4; op >= 3; op--) {
                                    if (obj.iop && obj.iop[op]) {
                                        this.menuOption[this.menuSize] = obj.iop[op] + ' @lre@' + obj.name;

                                        if (op === 3) {
                                            this.menuAction[this.menuSize] = MenuAction.OPHELD4;
                                        } else if (op === 4) {
                                            this.menuAction[this.menuSize] = MenuAction.OPHELD5;
                                        }

                                        this.menuParamA[this.menuSize] = obj.id;
                                        this.menuParamB[this.menuSize] = slot;
                                        this.menuParamC[this.menuSize] = child.id;
                                        this.menuSize++;
                                    } else if (op === 4) {
                                        this.menuOption[this.menuSize] = 'Drop @lre@' + obj.name;
                                        this.menuAction[this.menuSize] = MenuAction.OPHELD5;
                                        this.menuParamA[this.menuSize] = obj.id;
                                        this.menuParamB[this.menuSize] = slot;
                                        this.menuParamC[this.menuSize] = child.id;
                                        this.menuSize++;
                                    }
                                }
                            }

                            if (child.usable) {
                                this.menuOption[this.menuSize] = 'Use @lre@' + obj.name;
                                this.menuAction[this.menuSize] = MenuAction.OPHELDT_START;
                                this.menuParamA[this.menuSize] = obj.id;
                                this.menuParamB[this.menuSize] = slot;
                                this.menuParamC[this.menuSize] = child.id;
                                this.menuSize++;
                            }

                            if (child.interactable && obj.iop) {
                                for (let op: number = 2; op >= 0; op--) {
                                    if (obj.iop[op]) {
                                        this.menuOption[this.menuSize] = obj.iop[op] + ' @lre@' + obj.name;

                                        if (op === 0) {
                                            this.menuAction[this.menuSize] = MenuAction.OPHELD1;
                                        } else if (op === 1) {
                                            this.menuAction[this.menuSize] = MenuAction.OPHELD2;
                                        } else if (op === 2) {
                                            this.menuAction[this.menuSize] = MenuAction.OPHELD3;
                                        }

                                        this.menuParamA[this.menuSize] = obj.id;
                                        this.menuParamB[this.menuSize] = slot;
                                        this.menuParamC[this.menuSize] = child.id;
                                        this.menuSize++;
                                    }
                                }
                            }

                            if (child.iop) {
                                for (let op: number = 4; op >= 0; op--) {
                                    if (child.iop[op]) {
                                        this.menuOption[this.menuSize] = child.iop[op] + ' @lre@' + obj.name;

                                        if (op === 0) {
                                            this.menuAction[this.menuSize] = MenuAction.INV_BUTTON1;
                                        } else if (op === 1) {
                                            this.menuAction[this.menuSize] = MenuAction.INV_BUTTON2;
                                        } else if (op === 2) {
                                            this.menuAction[this.menuSize] = MenuAction.INV_BUTTON3;
                                        } else if (op === 3) {
                                            this.menuAction[this.menuSize] = MenuAction.INV_BUTTON4;
                                        } else if (op === 4) {
                                            this.menuAction[this.menuSize] = MenuAction.INV_BUTTON5;
                                        }

                                        this.menuParamA[this.menuSize] = obj.id;
                                        this.menuParamB[this.menuSize] = slot;
                                        this.menuParamC[this.menuSize] = child.id;
                                        this.menuSize++;
                                    }
                                }
                            }

                            this.menuOption[this.menuSize] = 'Examine @lre@' + obj.name;
                            this.menuAction[this.menuSize] = MenuAction.OPHELD6;
                            this.menuParamA[this.menuSize] = obj.id;
                            if (child.linkObjCount) {
                                this.menuParamC[this.menuSize] = child.linkObjCount[slot];
                            }
                            this.menuSize++;
                        }

                        slot++;
                    }
                }
            } else if (mouseX >= childX && mouseY >= childY && mouseX < childX + child.width && mouseY < childY + child.height) {
                if (child.buttonType === ButtonType.BUTTON_OK) {
                    let override: boolean = false;
                    if (child.clientCode !== 0) {
                        override = this.addSocialListOptions(child);
                    }

                    if (!override && child.option) {
                        this.menuOption[this.menuSize] = child.option;
                        this.menuAction[this.menuSize] = MenuAction.IF_BUTTON;
                        this.menuParamC[this.menuSize] = child.id;
                        this.menuSize++;
                    }
                } else if (child.buttonType === ButtonType.BUTTON_TARGET && this.spellSelected === 0) {
                    let prefix: string | null = child.targetVerb;
                    if (prefix && prefix.indexOf(' ') !== -1) {
                        prefix = prefix.substring(0, prefix.indexOf(' '));
                    }

                    this.menuOption[this.menuSize] = prefix + ' @gre@' + child.targetText;
                    this.menuAction[this.menuSize] = MenuAction.OPHELDT_SELECT;
                    this.menuParamC[this.menuSize] = child.id;
                    this.menuSize++;
                } else if (child.buttonType === ButtonType.BUTTON_CLOSE) {
                    this.menuOption[this.menuSize] = 'Close';
                    this.menuAction[this.menuSize] = MenuAction.CLOSE_MODAL;
                    this.menuParamC[this.menuSize] = child.id;
                    this.menuSize++;
                } else if (child.buttonType === ButtonType.BUTTON_TOGGLE && child.option) {
                    this.menuOption[this.menuSize] = child.option;
                    this.menuAction[this.menuSize] = MenuAction.IF_BUTTON_TOGGLE;
                    this.menuParamC[this.menuSize] = child.id;
                    this.menuSize++;
                } else if (child.buttonType === ButtonType.BUTTON_SELECT && child.option) {
                    this.menuOption[this.menuSize] = child.option;
                    this.menuAction[this.menuSize] = MenuAction.IF_BUTTON_SELECT;
                    this.menuParamC[this.menuSize] = child.id;
                    this.menuSize++;
                } else if (child.buttonType === ButtonType.BUTTON_CONTINUE && !this.resumedPauseButton && child.option) {
                    this.menuOption[this.menuSize] = child.option;
                    this.menuAction[this.menuSize] = MenuAction.RESUME_PAUSEBUTTON;
                    this.menuParamC[this.menuSize] = child.id;
                    this.menuSize++;
                }
            }
        }
    }

    private addSocialListOptions(component: IfType): boolean {
        let clientCode: number = component.clientCode;

        if ((clientCode >= ClientCode.CC_FRIENDS_START && clientCode <= ClientCode.CC_FRIENDS_UPDATE_END) || (clientCode >= 701 && clientCode <= 900)) {
            if (clientCode >= 801) {
                clientCode -= 701;
            } else if (clientCode >= 701) {
                clientCode -= 601;
            } else if (clientCode >= ClientCode.CC_FRIENDS_UPDATE_START) {
                clientCode -= ClientCode.CC_FRIENDS_UPDATE_START;
            } else {
                clientCode--;
            }

            this.menuOption[this.menuSize] = 'Remove @whi@' + this.friendName[clientCode];
            this.menuAction[this.menuSize] = MenuAction.FRIENDLIST_DEL;
            this.menuSize++;

            this.menuOption[this.menuSize] = 'Message @whi@' + this.friendName[clientCode];
            this.menuAction[this.menuSize] = MenuAction.MESSAGE_PRIVATE;
            this.menuSize++;
            return true;
        } else if (clientCode >= ClientCode.CC_IGNORES_START && clientCode <= ClientCode.CC_IGNORES_END) {
            this.menuOption[this.menuSize] = 'Remove @whi@' + component.text;
            this.menuAction[this.menuSize] = MenuAction.IGNORELIST_DEL;
            this.menuSize++;
            return true;
        }

        return false;
    }

    private resetInterfaceAnimation(id: number): void {
        const parent: IfType = IfType.list[id];
        if (!parent.children) {
            return;
        }

        for (let i: number = 0; i < parent.children.length && parent.children[i] !== -1; i++) {
            const child: IfType = IfType.list[parent.children[i]];

            if (child.type === 1) {
                this.resetInterfaceAnimation(child.id);
            }

            child.animFrame = 0;
            child.animCycle = 0;
        }
    }

    // jag::oldscape::Client::AnimateLayer
    private animateLayer(id: number, delta: number): boolean {
        const parent: IfType = IfType.list[id];
        if (!parent.children) {
            return false;
        }

        let updated: boolean = false;

        for (let i: number = 0; i < parent.children.length && parent.children[i] !== -1; i++) {
            const child: IfType = IfType.list[parent.children[i]];
            if (child.type === 1) {
                updated ||= this.animateLayer(child.id, delta);
            }

            if (child.type === 6 && (child.modelAnim !== -1 || child.model2Anim !== -1)) {
                const active: boolean = this.getIfActive(child);

                let seqId: number;
                if (active) {
                    seqId = child.model2Anim;
                } else {
                    seqId = child.modelAnim;
                }

                if (seqId !== -1) {
                    const type: SeqType = SeqType.list[seqId];
                    child.animCycle += delta;

                    while (child.animCycle > type.getDuration(child.animFrame)) {
                        child.animCycle -= type.getDuration(child.animFrame) + 1;
                        child.animFrame++;

                        if (child.animFrame >= type.numFrames) {
                            child.animFrame -= type.loops;

                            if (child.animFrame < 0 || child.animFrame >= type.numFrames) {
                                child.animFrame = 0;
                            }
                        }

                        updated = true;
                    }
                }
            }
        }

        return updated;
    }

    private updateVarp(id: number): void {
        const clientcode: number = VarpType.list[id].clientcode;
        if (clientcode === 0) {
            return;
        }

        const value: number = this.var[id];
        if (clientcode === 1) {
            if (value === 1) {
                Pix3D.initColourTable(0.9);
            } else if (value === 2) {
                Pix3D.initColourTable(0.8);
            } else if (value === 3) {
                Pix3D.initColourTable(0.7);
            } else if (value === 4) {
                Pix3D.initColourTable(0.6);
            }

            ObjType.spriteCache?.clear();
            this.redrawFrame = true;
        } else if (clientcode === 3) {
            const lastMidiActive: boolean = this.midiActive;

            if (value === 0) {
                this.midiVolume = 128;
                setMidiVolume(128);
                this.midiActive = true;
            } else if (value === 1) {
                this.midiVolume = 96;
                setMidiVolume(96);
                this.midiActive = true;
            } else if (value === 2) {
                this.midiVolume = 64;
                setMidiVolume(64);
                this.midiActive = true;
            } else if (value === 3) {
                this.midiVolume = 32;
                setMidiVolume(32);
                this.midiActive = true;
            } else if (value === 4) {
                this.midiActive = false;
            }

            if (this.midiActive !== lastMidiActive) {
                if (this.midiActive) {
                    this.midiSong = this.nextMidiSong;
                    this.midiFading = false;
                    this.onDemand?.request(2, this.midiSong);
                } else {
                    stopMidi(false);
                }

                this.nextMusicDelay = 0;
            }
        } else if (clientcode === 4) {
            if (value === 0) {
                this.waveVolume = 128;
                setWaveVolume(128);
                this.waveEnabled = true;
            } else if (value === 1) {
                this.waveVolume = 96;
                setWaveVolume(96);
                this.waveEnabled = true;
            } else if (value === 2) {
                this.waveVolume = 64;
                setWaveVolume(64);
                this.waveEnabled = true;
            } else if (value === 3) {
                this.waveVolume = 32;
                setWaveVolume(32);
                this.waveEnabled = true;
            } else if (value === 4) {
                this.waveEnabled = false;
            }
        } else if (clientcode === 5) {
            this.oneMouseButton = value;
        } else if (clientcode === 6) {
            this.chatEffects = value;
        } else if (clientcode === 8) {
            this.splitPrivateChat = value;
            this.redrawChatback = true;
        } else if (clientcode === 9) {
            this.bankArrangeMode = value;
        }
    }

    private updateInterfaceContent(com: IfType): void {
        let clientCode: number = com.clientCode;

        if ((clientCode >= ClientCode.CC_FRIENDS_START && clientCode <= ClientCode.CC_FRIENDS_END) || (clientCode >= ClientCode.CC_FRIENDS2_START && clientCode <= ClientCode.CC_FRIENDS2_END)) {
            if (clientCode === ClientCode.CC_FRIENDS_START && this.friendListStatus === 0) {
                com.text = 'Loading friend list';
                com.buttonType = 0;
            } else if (clientCode === ClientCode.CC_FRIENDS_START && this.friendListStatus === 1) {
                com.text = 'Connecting to friendserver';
                com.buttonType = 0;
            } else if (clientCode === 2 && this.friendListStatus !== 2) {
                com.text = 'Please wait...';
                com.buttonType = 0;
            } else {
                let count = this.friendCount;
                if (this.friendListStatus != 2) {
                    count = 0;
                }

                if (clientCode > 700) {
                    clientCode -= 601;
                } else {
                    clientCode -= 1;
                }

                if (clientCode >= count) {
                    com.text = '';
                    com.buttonType = 0;
                } else {
                    com.text = this.friendName[clientCode];
                    com.buttonType = 1;
                }
            }
        } else if ((clientCode >= ClientCode.CC_FRIENDS_UPDATE_START && clientCode <= ClientCode.CC_FRIENDS_UPDATE_END) || (clientCode >= ClientCode.CC_FRIENDS2_UPDATE_START && clientCode <= ClientCode.CC_FRIENDS2_UPDATE_END)) {
            let count = this.friendCount;
            if (this.friendListStatus != 2) {
                count = 0;
            }

            if (clientCode > 800) {
                clientCode -= 701;
            } else {
                clientCode -= 101;
            }

            if (clientCode >= count) {
                com.text = '';
                com.buttonType = 0;
            } else {
                if (this.friendWorld[clientCode] === 0) {
                    com.text = '@red@Offline';
                } else if (this.friendWorld[clientCode] === Client.nodeId) {
                    com.text = '@gre@World-' + (this.friendWorld[clientCode] - 9);
                } else {
                    com.text = '@yel@World-' + (this.friendWorld[clientCode] - 9);
                }

                com.buttonType = 1;
            }
        } else if (clientCode === ClientCode.CC_FRIENDS_SIZE) {
            let count = this.friendCount;
            if (this.friendListStatus != 2) {
                count = 0;
            }

            com.scrollSize = count * 15 + 20;

            if (com.scrollSize <= com.height) {
                com.scrollSize = com.height + 1;
            }
        } else if (clientCode >= ClientCode.CC_IGNORES_START && clientCode <= ClientCode.CC_IGNORES_END) {
            clientCode -= ClientCode.CC_IGNORES_START;

            if (clientCode >= this.ignoreCount) {
                com.text = '';
                com.buttonType = 0;
            } else {
                com.text = JString.formatName(JString.fromBase37(this.ignoreName37[clientCode]));
                com.buttonType = 1;
            }
        } else if (clientCode === ClientCode.CC_IGNORES_SIZE) {
            com.scrollSize = this.ignoreCount * 15 + 20;

            if (com.scrollSize <= com.height) {
                com.scrollSize = com.height + 1;
            }
        } else if (clientCode === ClientCode.CC_DESIGN_PREVIEW) {
            com.modelXAn = 150;
            com.modelYAn = ((Math.sin(this.loopCycle / 40.0) * 256.0) | 0) & 0x7ff;

            if (this.updateDesignModel) {
                for (let i = 0; i < 7; i++) {
                    const kit = this.designKits[i];
                    if (kit >= 0 && !IdkType.list[kit].checkModel()) {
                        return;
                    }
                }

                this.updateDesignModel = false;

                const models: (Model | null)[] = new TypedArray1d(7, null);
                let modelCount: number = 0;
                for (let part: number = 0; part < 7; part++) {
                    const kit: number = this.designKits[part];
                    if (kit >= 0) {
                        models[modelCount++] = IdkType.list[kit].getModelNoCheck();
                    }
                }

                const model: Model = Model.combine(models, modelCount);
                for (let part: number = 0; part < 5; part++) {
                    if (this.designColours[part] !== 0) {
                        model.recolour(ClientPlayer.recol1d[part][0], ClientPlayer.recol1d[part][this.designColours[part]]);

                        if (part === 1) {
                            model.recolour(ClientPlayer.recol2d[0], ClientPlayer.recol2d[this.designColours[part]]);
                        }
                    }
                }

                model.prepareAnim();
                model.calculateNormals(64, 850, -30, -50, -30, true);

                if (this.localPlayer) {
                    const frames: Int16Array | null = SeqType.list[this.localPlayer.readyanim].frames;
                    if (frames) {
                        model.animate(frames[0]);
                    }
                }

                com.modelType = 5;
                com.modelId = 0;
                IfType.cacheModel(model, 5, 0);
            }
        } else if (clientCode === ClientCode.CC_SWITCH_TO_MALE) {
            if (!this.genderButton1) {
                this.genderButton1 = com.graphic;
                this.genderButton2 = com.graphic2;
            }

            if (this.designGender) {
                com.graphic = this.genderButton2;
            } else {
                com.graphic = this.genderButton1;
            }
        } else if (clientCode === ClientCode.CC_SWITCH_TO_FEMALE) {
            if (!this.genderButton1) {
                this.genderButton1 = com.graphic;
                this.genderButton2 = com.graphic2;
            }

            if (this.designGender) {
                com.graphic = this.genderButton1;
            } else {
                com.graphic = this.genderButton2;
            }
        } else if (clientCode === ClientCode.CC_REPORT_INPUT) {
            com.text = this.reportAbuseInput;

            if (this.loopCycle % 20 < 10) {
                com.text = com.text + '|';
            } else {
                com.text = com.text + ' ';
            }
        } else if (clientCode === ClientCode.CC_MOD_MUTE) {
            if (this.staffmodlevel < 1) {
                com.text = '';
            } else if (this.reportAbuseMuteOption) {
                com.colour = Colour.RED;
                com.text = 'Moderator option: Mute player for 48 hours: <ON>';
            } else {
                com.colour = Colour.WHITE;
                com.text = 'Moderator option: Mute player for 48 hours: <OFF>';
            }
        } else if (clientCode === ClientCode.CC_LAST_LOGIN_INFO || clientCode === ClientCode.CC_LAST_LOGIN_INFO2) {
            if (this.lastAddress === 0) {
                com.text = '';
            } else {
                let text: string;
                if (this.daysSinceLastLogin === 0) {
                    text = 'earlier today';
                } else if (this.daysSinceLastLogin === 1) {
                    text = 'yesterday';
                } else {
                    text = this.daysSinceLastLogin + ' days ago';
                }

                // Show IP only if not 127.0.0.1 (servers may opt into privacy, making it needless info)
                const ipStr = JString.formatIPv4(this.lastAddress); // would be a DNS lookup if we could...
                com.text = 'You last logged in ' + text + (ipStr === '127.0.0.1' ? '.' : ' from: ' + ipStr);
            }
        } else if (clientCode === ClientCode.CC_UNREAD_MESSAGES) {
            if (this.unreadMessages === 0) {
                com.text = '0 unread messages';
                com.colour = Colour.YELLOW;
            } else if (this.unreadMessages === 1) {
                com.text = '1 unread message';
                com.colour = Colour.GREEN;
            } else if (this.unreadMessages > 1) {
                com.text = this.unreadMessages + ' unread messages';
                com.colour = Colour.GREEN;
            }
        } else if (clientCode === ClientCode.CC_RECOVERY1) {
            if (this.daysSinceRecoveriesChanged === 201) {
                if (this.warnMembersInNonMembers == 1) {
                    com.text = '@yel@This is a non-members world: @whi@Since you are a member we';
                } else {
                    com.text = '';
                }
            } else if (this.daysSinceRecoveriesChanged === 200) {
                com.text = 'You have not yet set any password recovery questions.';
            } else {
                let text: string;
                if (this.daysSinceRecoveriesChanged === 0) {
                    text = 'Earlier today';
                } else if (this.daysSinceRecoveriesChanged === 1) {
                    text = 'Yesterday';
                } else {
                    text = this.daysSinceRecoveriesChanged + ' days ago';
                }

                com.text = text + ' you changed your recovery questions';
            }
        } else if (clientCode === ClientCode.CC_RECOVERY2) {
            if (this.daysSinceRecoveriesChanged === 201) {
                if (this.warnMembersInNonMembers == 1) {
                    com.text = '@whi@recommend you use a members world instead. You may use';
                } else {
                    com.text = '';
                }
            } else if (this.daysSinceRecoveriesChanged === 200) {
                com.text = 'We strongly recommend you do so now to secure your account.';
            } else {
                com.text = 'If you do not remember making this change then cancel it immediately';
            }
        } else if (clientCode === ClientCode.CC_RECOVERY3) {
            if (this.daysSinceRecoveriesChanged === 201) {
                if (this.warnMembersInNonMembers == 1) {
                    com.text = '@whi@this world but member benefits are unavailable whilst here.';
                } else {
                    com.text = '';
                }
            } else if (this.daysSinceRecoveriesChanged === 200) {
                com.text = "Do this from the 'account management' area on our front webpage";
            } else {
                com.text = "Do this from the 'account management' area on our front webpage";
            }
        }
    }

    private handleInterfaceAction(com: IfType): boolean {
        const clientCode: number = com.clientCode;

        if (this.friendListStatus === 2) {
            if (clientCode === ClientCode.CC_ADD_FRIEND) {
                this.redrawChatback = true;
                this.dialogInputOpen = false;
                this.socialInputOpen = true;
                this.socialInput = '';
                this.socialInputType = 1;
                this.socialMessage = 'Enter name of friend to add to list';
            } else if (clientCode === ClientCode.CC_DEL_FRIEND) {
                this.redrawChatback = true;
                this.dialogInputOpen = false;
                this.socialInputOpen = true;
                this.socialInput = '';
                this.socialInputType = 2;
                this.socialMessage = 'Enter name of friend to delete from list';
            }
        }

        if (clientCode === ClientCode.CC_LOGOUT) {
            this.logoutTimer = 250;
            return true;
        } else if (clientCode === ClientCode.CC_ADD_IGNORE) {
            this.redrawChatback = true;
            this.dialogInputOpen = false;
            this.socialInputOpen = true;
            this.socialInput = '';
            this.socialInputType = 4;
            this.socialMessage = 'Enter name of player to add to list';
        } else if (clientCode === ClientCode.CC_DEL_IGNORE) {
            this.redrawChatback = true;
            this.dialogInputOpen = false;
            this.socialInputOpen = true;
            this.socialInput = '';
            this.socialInputType = 5;
            this.socialMessage = 'Enter name of player to delete from list';
        } else if (clientCode >= ClientCode.CC_CHANGE_HEAD_L && clientCode <= ClientCode.CC_CHANGE_FEET_R) {
            const part: number = ((clientCode - 300) / 2) | 0;
            const direction: number = clientCode & 0x1;
            let kit: number = this.designKits[part];

            if (kit !== -1) {
                while (true) {
                    if (direction === 0) {
                        kit--;
                        if (kit < 0) {
                            kit = IdkType.count - 1;
                        }
                    }

                    if (direction === 1) {
                        kit++;
                        if (kit >= IdkType.count) {
                            kit = 0;
                        }
                    }

                    if (!IdkType.list[kit].disable && IdkType.list[kit].type === part + (this.designGender ? 0 : 7)) {
                        this.designKits[part] = kit;
                        this.updateDesignModel = true;
                        break;
                    }
                }
            }
        } else if (clientCode >= ClientCode.CC_RECOLOUR_HAIR_L && clientCode <= ClientCode.CC_RECOLOUR_SKIN_R) {
            const part: number = ((clientCode - 314) / 2) | 0;
            const direction: number = clientCode & 0x1;
            let colour: number = this.designColours[part];

            if (direction === 0) {
                colour--;
                if (colour < 0) {
                    colour = ClientPlayer.recol1d[part].length - 1;
                }
            }

            if (direction === 1) {
                colour++;
                if (colour >= ClientPlayer.recol1d[part].length) {
                    colour = 0;
                }
            }

            this.designColours[part] = colour;
            this.updateDesignModel = true;
        } else if (clientCode === ClientCode.CC_SWITCH_TO_MALE && !this.designGender) {
            this.designGender = true;
            this.validateCharacterDesign();
        } else if (clientCode === ClientCode.CC_SWITCH_TO_FEMALE && this.designGender) {
            this.designGender = false;
            this.validateCharacterDesign();
        } else if (clientCode === ClientCode.CC_ACCEPT_DESIGN) {
            this.out.pIsaac(ClientProt.IDK_SAVEDESIGN);
            this.out.p1(this.designGender ? 0 : 1);

            for (let i: number = 0; i < 7; i++) {
                this.out.p1(this.designKits[i]);
            }

            for (let i: number = 0; i < 5; i++) {
                this.out.p1(this.designColours[i]);
            }

            return true;
        } else if (clientCode === ClientCode.CC_MOD_MUTE) {
            this.reportAbuseMuteOption = !this.reportAbuseMuteOption;
        } else if (clientCode >= ClientCode.CC_REPORT_RULE1 && clientCode <= ClientCode.CC_REPORT_RULE12) {
            this.closeModal();

            if (this.reportAbuseInput.length > 0) {
                this.out.pIsaac(ClientProt.REPORT_ABUSE);
                this.out.p8(JString.toBase37(this.reportAbuseInput));
                this.out.p1(clientCode - 601);
                this.out.p1(this.reportAbuseMuteOption ? 1 : 0);
            }
        }

        return false;
    }

    private validateCharacterDesign(): void {
        this.updateDesignModel = true;

        for (let i: number = 0; i < 7; i++) {
            this.designKits[i] = -1;

            for (let j: number = 0; j < IdkType.count; j++) {
                if (!IdkType.list[j].disable && IdkType.list[j].type === i + (this.designGender ? 0 : 7)) {
                    this.designKits[i] = j;
                    break;
                }
            }
        }
    }

    private drawSidebar(): void {
        this.areaSidebar?.bind();
        if (this.sidebarScanline) {
            Pix3D.scanline = this.sidebarScanline;
        }

        this.invback?.plotSprite(0, 0);

        if (this.sideLayerId !== -1) {
            this.drawLayer(IfType.list[this.sideLayerId], 0, 0, 0);
        } else if (this.sideTabLayerId[this.sideTab] !== -1) {
            this.drawLayer(IfType.list[this.sideTabLayerId[this.sideTab]], 0, 0, 0);
        }

        if (this.menuVisible && this.menuArea === 1) {
            this.drawMinimenu();
        }

        this.areaSidebar?.draw(553, 205);

        this.areaViewport?.bind();
        if (this.viewportScanline) {
            Pix3D.scanline = this.viewportScanline;
        }
    }

    private drawChat(): void {
        this.areaChatback?.bind();
        if (this.chatbackScanline) {
            Pix3D.scanline = this.chatbackScanline;
        }

        this.chatback?.plotSprite(0, 0);

        if (this.socialInputOpen) {
            this.fontBold12?.centreString(239, 40, this.socialMessage, Colour.BLACK);
            this.fontBold12?.centreString(239, 60, this.socialInput + '*', Colour.DARKBLUE);
        } else if (this.dialogInputOpen) {
            this.fontBold12?.centreString(239, 40, 'Enter amount:', Colour.BLACK);
            this.fontBold12?.centreString(239, 60, this.chatbackInput + '*', Colour.DARKBLUE);
        } else if (this.modalMessage) {
            this.fontBold12?.centreString(239, 40, this.modalMessage, Colour.BLACK);
            this.fontBold12?.centreString(239, 60, 'Click to continue', Colour.DARKBLUE);
        } else if (this.chatLayerId !== -1) {
            this.drawLayer(IfType.list[this.chatLayerId], 0, 0, 0);
        } else if (this.tutLayerId !== -1) {
            this.drawLayer(IfType.list[this.tutLayerId], 0, 0, 0);
        } else {
            const font: PixFont | null = this.fontPlain12;
            let line: number = 0;

            Pix2D.setClipping(0, 0, 463, 77);

            for (let i: number = 0; i < 100; i++) {
                const message: string | null = this.messageText[i];
                if (!message) {
                    continue;
                }

                const type: number = this.messageType[i];
                const y: number = this.chatScrollOffset + 70 - line * 14;

                let sender = this.messageSender[i];
                let modlevel = 0;
                if (sender && sender.startsWith('@cr1@')) {
                    sender = sender.substring(5);
                    modlevel = 1;
                } else if (sender && sender.startsWith('@cr2@')) {
                    sender = sender.substring(5);
                    modlevel = 2;
                }

                if (type === 0) {
                    if (y > 0 && y < 110) {
                        font?.drawString(4, y, message, Colour.BLACK);
                    }

                    line++;
                } else if ((type === 1 || type === 2) && (type === 1 || this.chatPublicMode === 0 || (this.chatPublicMode === 1 && this.isFriend(sender)))) {
                    if (y > 0 && y < 110) {
                        let x = 4;
                        if (modlevel == 1) {
                            this.modIcons[0].plotSprite(x, y - 12);
                            x += 14;
                        } else if (modlevel == 2) {
                            this.modIcons[1].plotSprite(x, y - 12);
                            x += 14;
                        }

                        font?.drawString(x, y, sender + ':', Colour.BLACK);
                        x += (font?.stringWid(sender) ?? 0) + 8;

                        font?.drawString(x, y, message, Colour.BLUE);
                    }

                    line++;
                } else if ((type === 3 || type === 7) && this.splitPrivateChat === 0 && (type === 7 || this.chatPrivateMode === 0 || (this.chatPrivateMode === 1 && this.isFriend(sender)))) {
                    if (y > 0 && y < 110) {
                        let x = 4;

                        font?.drawString(x, y, 'From ', Colour.BLACK);
                        x += font?.stringWid('From ') ?? 0;

                        if (modlevel == 1) {
                            this.modIcons[0].plotSprite(x, y - 12);
                            x += 14;
                        } else if (modlevel == 2) {
                            this.modIcons[1].plotSprite(x, y - 12);
                            x += 14;
                        }

                        font?.drawString(x, y, sender + ':', Colour.BLACK);
                        x += (font?.stringWid(sender) ?? 0) + 8;

                        font?.drawString(x, y, message, Colour.DARKRED);
                    }

                    line++;
                } else if (type === 4 && (this.chatTradeMode === 0 || (this.chatTradeMode === 1 && this.isFriend(sender)))) {
                    if (y > 0 && y < 110) {
                        font?.drawString(4, y, sender + ' ' + this.messageText[i], 0x800080);
                    }

                    line++;
                } else if (type === 5 && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
                    if (y > 0 && y < 110) {
                        font?.drawString(4, y, message, Colour.DARKRED);
                    }

                    line++;
                } else if (type === 6 && this.splitPrivateChat === 0 && this.chatPrivateMode < 2) {
                    if (y > 0 && y < 110) {
                        font?.drawString(4, y, 'To ' + sender + ':', Colour.BLACK);
                        font?.drawString(font.stringWid('To ' + sender) + 12, y, message, Colour.DARKRED);
                    }

                    line++;
                } else if (type === 8 && (this.chatTradeMode === 0 || (this.chatTradeMode === 1 && this.isFriend(sender)))) {
                    if (y > 0 && y < 110) {
                        font?.drawString(4, y, sender + ' ' + this.messageText[i], 0x7e3200);
                    }

                    line++;
                }
            }

            Pix2D.resetClipping();

            this.chatScrollHeight = line * 14 + 7;
            if (this.chatScrollHeight < 78) {
                this.chatScrollHeight = 78;
            }

            this.drawScrollbar(463, 0, this.chatScrollHeight - this.chatScrollOffset - 77, this.chatScrollHeight, 77);

            let username;
            if (this.localPlayer == null || this.localPlayer.name == null) {
                username = JString.formatName(this.loginUser);
            } else {
                username = this.localPlayer.name;
            }

            font?.drawString(4, 90, username + ':', Colour.BLACK);
            font?.drawString(font.stringWid(username + ': ') + 6, 90, this.chatTyped + '*', Colour.BLUE);

            Pix2D.hline(0, 77, Colour.BLACK, 479);
        }

        if (this.menuVisible && this.menuArea === 2) {
            this.drawMinimenu();
        }

        this.areaChatback?.draw(17, 357);

        this.areaViewport?.bind();
        if (this.viewportScanline) {
            Pix3D.scanline = this.viewportScanline;
        }
    }

    private drawMinimap(): void {
        if (!this.localPlayer) {
            return;
        }

        this.areaMapback?.bind();

        const angle: number = (this.orbitCameraYaw + this.macroMinimapAngle) & 0x7ff;
        let anchorX: number = ((this.localPlayer.x / 32) | 0) + 48;
        let anchorY: number = 464 - ((this.localPlayer.z / 32) | 0);

        this.minimap?.scanlineRotatePlotSprite(25, 5, 146, 151, this.minimapMaskLineOffsets, this.minimapMaskLineLengths, anchorX, anchorY, angle, this.macroMinimapZoom + 256);
        this.compass?.scanlineRotatePlotSprite(0, 0, 33, 33, this.compassMaskLineOffsets, this.compassMaskLineLengths, 25, 25, this.orbitCameraYaw, 256);

        for (let i: number = 0; i < this.activeMapFunctionCount; i++) {
            anchorX = this.activeMapFunctionX[i] * 4 + 2 - ((this.localPlayer.x / 32) | 0);
            anchorY = this.activeMapFunctionZ[i] * 4 + 2 - ((this.localPlayer.z / 32) | 0);
            this.drawOnMinimap(anchorY, this.activeMapFunctions[i], anchorX);
        }

        for (let ltx: number = 0; ltx < CollisionConstants.SIZE; ltx++) {
            for (let ltz: number = 0; ltz < CollisionConstants.SIZE; ltz++) {
                const objs = this.objStacks[this.minusedlevel][ltx][ltz];
                if (objs) {
                    anchorX = ltx * 4 + 2 - ((this.localPlayer.x / 32) | 0);
                    anchorY = ltz * 4 + 2 - ((this.localPlayer.z / 32) | 0);
                    this.drawOnMinimap(anchorY, this.mapdots1, anchorX);
                }
            }
        }

        for (let i: number = 0; i < this.npcCount; i++) {
            const npc: ClientNpc | null = this.npc[this.npcIds[i]];
            if (npc && npc.isReady() && npc.type && npc.type.minimap) {
                anchorX = ((npc.x / 32) | 0) - ((this.localPlayer.x / 32) | 0);
                anchorY = ((npc.z / 32) | 0) - ((this.localPlayer.z / 32) | 0);
                this.drawOnMinimap(anchorY, this.mapdots2, anchorX);
            }
        }

        for (let i: number = 0; i < this.playerCount; i++) {
            const player: ClientPlayer | null = this.players[this.playerIds[i]];
            if (player && player.isReady() && player.name) {
                anchorX = ((player.x / 32) | 0) - ((this.localPlayer.x / 32) | 0);
                anchorY = ((player.z / 32) | 0) - ((this.localPlayer.z / 32) | 0);

                let friend: boolean = false;
                const name37: bigint = JString.toBase37(player.name);
                for (let j: number = 0; j < this.friendCount; j++) {
                    if (name37 === this.friendName37[j] && this.friendWorld[j] !== 0) {
                        friend = true;
                        break;
                    }
                }

                if (friend) {
                    this.drawOnMinimap(anchorY, this.mapdots4, anchorX);
                } else {
                    this.drawOnMinimap(anchorY, this.mapdots3, anchorX);
                }
            }
        }

        if (this.hintType != 0 && this.loopCycle % 20 < 10) {
            if (this.hintType == 1 && this.hintNpc >= 0 && this.hintNpc < this.npc.length) {
                const npc = this.npc[this.hintNpc];

                if (npc != null) {
                    const x = ((npc.x / 32) | 0) - ((this.localPlayer.x / 32) | 0);
                    const y = ((npc.z / 32) | 0) - ((this.localPlayer.z / 32) | 0);
                    this.drawMinimapHint(x, y, this.mapmarker2);
                }
            } else if (this.hintType == 2) {
                const x = (this.hintTileX - this.mapBuildBaseX) * 4 + 2 - ((this.localPlayer.x / 32) | 0);
                const y = (this.hintTileZ - this.mapBuildBaseZ) * 4 + 2 - ((this.localPlayer.z / 32) | 0);
                this.drawMinimapHint(x, y, this.mapmarker2);
            } else if (this.hintType == 10 && this.hintPlayer >= 0 && this.hintPlayer < this.players.length) {
                const player = this.players[this.hintPlayer];

                if (player != null) {
                    const x = ((player.x / 32) | 0) - ((this.localPlayer.x / 32) | 0);
                    const y = ((player.z / 32) | 0) - ((this.localPlayer.z / 32) | 0);
                    this.drawMinimapHint(x, y, this.mapmarker2);
                }
            }
        }

        if (this.minimapFlagX !== 0) {
            anchorX = ((this.minimapFlagX * 4) + 2) - ((this.localPlayer.x / 32) | 0);
            anchorY = ((this.minimapFlagZ * 4) + 2) - ((this.localPlayer.z / 32) | 0);
            this.drawOnMinimap(anchorY, this.mapmarker1, anchorX);
        }

        // the white square local player position in the center of the minimap.
        Pix2D.fillRect(97, 78, 3, 3, Colour.WHITE);

        this.areaViewport?.bind();
    }

    drawMinimapHint(dx: number, dy: number, image: Pix32 | null) {
        if (!image) {
            return;
        }

        const distance = dx * dx + dy * dy;
        if (distance <= 4225 || distance >= 90000) {
            this.drawOnMinimap(dy, image, dx);
            return;
        }

        const angle: number = (this.orbitCameraYaw + this.macroMinimapAngle) & 0x7ff;

        let sinAngle: number = Pix3D.sinTable[angle];
        let cosAngle: number = Pix3D.cosTable[angle];

        sinAngle = ((sinAngle * 256) / (this.macroMinimapZoom + 256)) | 0;
        cosAngle = ((cosAngle * 256) / (this.macroMinimapZoom + 256)) | 0;

        const x: number = (dy * sinAngle + dx * cosAngle) >> 16;
        const y: number = (dy * cosAngle - dx * sinAngle) >> 16;

        const var13 = Math.atan2(x, y);
        const var15 = (Math.sin(var13) * 63.0) | 0;
        const var16 = (Math.cos(var13) * 57.0) | 0;

        this.mapedge?.rotatePlotSprite(83 - var16 - 20, var13, 256, 15, 15, 20, 20, var15 + 94 + 4 - 10);
    }

    private drawOnMinimap(dy: number, image: Pix32 | null, dx: number): void {
        if (!image) {
            return;
        }

        const distance: number = dx * dx + dy * dy;
        if (distance > 6400) {
            return;
        }

        const angle: number = (this.orbitCameraYaw + this.macroMinimapAngle) & 0x7ff;

        let sinAngle: number = Pix3D.sinTable[angle];
        let cosAngle: number = Pix3D.cosTable[angle];

        sinAngle = ((sinAngle * 256) / (this.macroMinimapZoom + 256)) | 0;
        cosAngle = ((cosAngle * 256) / (this.macroMinimapZoom + 256)) | 0;

        const x: number = (dy * sinAngle + dx * cosAngle) >> 16;
        const y: number = (dy * cosAngle - dx * sinAngle) >> 16;

        if (distance > 2500 && this.mapback) {
            image.scanlinePlotSprite(x + 94 - ((image.owi / 2) | 0) + 4, 83 - y - ((image.ohi / 2) | 0) - 4, this.mapback);
        } else {
            image.plotSprite(x + 94 - ((image.owi / 2) | 0) + 4, 83 - y - ((image.ohi / 2) | 0) - 4);
        }
    }

    // jag::oldscape::Client::AddChat
    private addChat(type: number, text: string, sender: string): void {
        if (type === 0 && this.tutLayerId !== -1) {
            this.modalMessage = text;
            this.mouseClickButton = 0;
        }

        if (this.chatLayerId === -1) {
            this.redrawChatback = true;
        }

        for (let i: number = 99; i > 0; i--) {
            this.messageType[i] = this.messageType[i - 1];
            this.messageSender[i] = this.messageSender[i - 1];
            this.messageText[i] = this.messageText[i - 1];
        }

        this.messageType[0] = type;
        this.messageSender[0] = sender;
        this.messageText[0] = text;
    }

    // jag::oldscape::FriendSystem::IsFriend
    private isFriend(username: string | null): boolean {
        if (!username) {
            return false;
        }

        for (let i: number = 0; i < this.friendCount; i++) {
            if (username.toLowerCase() === this.friendName[i]?.toLowerCase()) {
                return true;
            }
        }

        if (!this.localPlayer) {
            return false;
        }

        return username.toLowerCase() === this.localPlayer.name?.toLowerCase();
    }

    // jag::oldscape::FriendSystem::AddFriend
    private addFriend(username: bigint): void {
        if (username === 0n) {
            return;
        }

        if (this.friendCount >= 100 && this.membersAccount != 1) {
            this.addChat(0, 'Your friendlist is full. Max of 100 for free users, and 200 for members', '');
            return;
        } else if (this.friendCount >= 200) {
            this.addChat(0, 'Your friendlist is full. Max of 100 for free users, and 200 for members', '');
            return;
        }

        const displayName: string = JString.formatName(JString.fromBase37(username));
        for (let i: number = 0; i < this.friendCount; i++) {
            if (this.friendName37[i] === username) {
                this.addChat(0, displayName + ' is already on your friend list', '');
                return;
            }
        }

        for (let i: number = 0; i < this.ignoreCount; i++) {
            if (this.ignoreName37[i] === username) {
                this.addChat(0, 'Please remove ' + displayName + ' from your ignore list first', '');
                return;
            }
        }

        if (!this.localPlayer || !this.localPlayer.name) {
            return;
        }

        if (displayName !== this.localPlayer.name) {
            this.friendName[this.friendCount] = displayName;
            this.friendName37[this.friendCount] = username;
            this.friendWorld[this.friendCount] = 0;
            this.friendCount++;

            this.redrawSidebar = true;

            this.out.pIsaac(ClientProt.FRIENDLIST_ADD);
            this.out.p8(username);
        }
    }

    // jag::oldscape::FriendSystem::DelFriend
    private delFriend(username: bigint): void {
        if (username === 0n) {
            return;
        }

        for (let i: number = 0; i < this.friendCount; i++) {
            if (this.friendName37[i] === username) {
                this.friendCount--;
                this.redrawSidebar = true;

                for (let j: number = i; j < this.friendCount; j++) {
                    this.friendName[j] = this.friendName[j + 1];
                    this.friendWorld[j] = this.friendWorld[j + 1];
                    this.friendName37[j] = this.friendName37[j + 1];
                }

                this.out.pIsaac(ClientProt.FRIENDLIST_DEL);
                this.out.p8(username);
                return;
            }
        }
    }

    // jag::oldscape::FriendSystem::AddIgnore
    private addIgnore(username: bigint): void {
        if (username === 0n) {
            return;
        }

        if (this.ignoreCount >= 100) {
            this.addChat(0, 'Your ignore list is full. Max of 100 hit', '');
            return;
        }

        const displayName: string = JString.formatName(JString.fromBase37(username));
        for (let i: number = 0; i < this.ignoreCount; i++) {
            if (this.ignoreName37[i] === username) {
                this.addChat(0, displayName + ' is already on your ignore list', '');
                return;
            }
        }

        for (let i: number = 0; i < this.friendCount; i++) {
            if (this.friendName37[i] === username) {
                this.addChat(0, 'Please remove ' + displayName + ' from your friend list first', '');
                return;
            }
        }

        this.ignoreName37[this.ignoreCount++] = username;
        this.redrawSidebar = true;

        this.out.pIsaac(ClientProt.IGNORELIST_ADD);
        this.out.p8(username);
    }

    // jag::oldscape::FriendSystem::DelIgnore
    private delIgnore(username: bigint): void {
        if (username === 0n) {
            return;
        }

        for (let i: number = 0; i < this.ignoreCount; i++) {
            if (this.ignoreName37[i] === username) {
                this.ignoreCount--;
                this.redrawSidebar = true;

                for (let j: number = i; j < this.ignoreCount; j++) {
                    this.ignoreName37[j] = this.ignoreName37[j + 1];
                }

                this.out.pIsaac(ClientProt.IGNORELIST_DEL);
                this.out.p8(username);
                return;
            }
        }
    }

    private unloadTitle(): void {
        this.flameActive = false;

        if (this.flamesInterval) {
            clearInterval(this.flamesInterval);
            this.flamesInterval = null;
        }

        this.imageTitlebox = null;
        this.imageTitlebutton = null;
        this.imageRunes = [];

        this.flameGradient = null;
        this.flameGradient0 = null;
        this.flameGradient1 = null;
        this.flameGradient2 = null;

        this.flameBuffer0 = null;
        this.flameBuffer1 = null;
        this.flameBuffer3 = null;
        this.flameBuffer2 = null;

        this.imageFlamesLeft = null;
        this.imageFlamesRight = null;
    }

    // jag::oldscape::TitleFlames::RenderFlames
    renderFlames(): void {
        if (!this.flameActive) {
            return;
        }

        this.flameCycle++;

        // runs every ~40ms so update twice to compensate
        this.updateFlames();
        this.updateFlames();
        this.drawFlames();
    }

    // jag::oldscape::TitleFlames::UpdateFlames
    private updateFlames(): void {
        if (!this.flameBuffer3 || !this.flameBuffer2 || !this.flameBuffer0 || !this.flameLineOffset) {
            return;
        }

        const height: number = 256;

        for (let x: number = 10; x < 117; x++) {
            const rand: number = (Math.random() * 100.0) | 0;
            if (rand < 50) this.flameBuffer3[x + ((height - 2) << 7)] = 255;
        }

        for (let l: number = 0; l < 100; l++) {
            const x: number = ((Math.random() * 124.0) | 0) + 2;
            const y: number = ((Math.random() * 128.0) | 0) + 128;
            const index: number = x + (y << 7);
            this.flameBuffer3[index] = 192;
        }

        for (let y: number = 1; y < height - 1; y++) {
            for (let x: number = 1; x < 127; x++) {
                const index: number = x + (y << 7);
                this.flameBuffer2[index] = ((this.flameBuffer3[index - 1] + this.flameBuffer3[index + 1] + this.flameBuffer3[index - 128] + this.flameBuffer3[index + 128]) / 4) | 0;
            }
        }

        this.flameCycle0 += 128;
        if (this.flameCycle0 > this.flameBuffer0.length) {
            this.flameCycle0 -= this.flameBuffer0.length;
            this.generateFlameCoolingMap(this.imageRunes[(Math.random() * 12.0) | 0]);
        }

        for (let y: number = 1; y < height - 1; y++) {
            for (let x: number = 1; x < 127; x++) {
                const index: number = x + (y << 7);
                let intensity: number = this.flameBuffer2[index + 128] - ((this.flameBuffer0[(index + this.flameCycle0) & (this.flameBuffer0.length - 1)] / 5) | 0);
                if (intensity < 0) {
                    intensity = 0;
                }
                this.flameBuffer3[index] = intensity;
            }
        }

        for (let y: number = 0; y < height - 1; y++) {
            this.flameLineOffset[y] = this.flameLineOffset[y + 1];
        }

        this.flameLineOffset[height - 1] = (Math.sin(this.loopCycle / 14.0) * 16.0 + Math.sin(this.loopCycle / 15.0) * 14.0 + Math.sin(this.loopCycle / 16.0) * 12.0) | 0;

        if (this.flameGradientCycle0 > 0) {
            this.flameGradientCycle0 -= 4;
        }

        if (this.flameGradientCycle1 > 0) {
            this.flameGradientCycle1 -= 4;
        }

        if (this.flameGradientCycle0 === 0 && this.flameGradientCycle1 === 0) {
            const rand: number = (Math.random() * 2000.0) | 0;

            if (rand === 0) {
                this.flameGradientCycle0 = 1024;
            } else if (rand === 1) {
                this.flameGradientCycle1 = 1024;
            }
        }
    }

    // jag::oldscape::TitleFlames::GenerateFlameCoolingMap
    private generateFlameCoolingMap(image: Pix8 | null): void {
        if (!this.flameBuffer0 || !this.flameBuffer1) {
            return;
        }

        const flameHeight: number = 256;

        // Clears the initial flame buffer
        this.flameBuffer0.fill(0);

        // Blends the fire at random
        for (let i: number = 0; i < 5000; i++) {
            const rand: number = (Math.random() * 128.0 * flameHeight) | 0;
            this.flameBuffer0[rand] = (Math.random() * 256.0) | 0;
        }

        // changes colour between last few flames
        for (let i: number = 0; i < 20; i++) {
            for (let y: number = 1; y < flameHeight - 1; y++) {
                for (let x: number = 1; x < 127; x++) {
                    const index: number = x + (y << 7);
                    this.flameBuffer1[index] = ((this.flameBuffer0[index - 1] + this.flameBuffer0[index + 1] + this.flameBuffer0[index - 128] + this.flameBuffer0[index + 128]) / 4) | 0;
                }
            }

            const last: Int32Array = this.flameBuffer0;
            this.flameBuffer0 = this.flameBuffer1;
            this.flameBuffer1 = last;
        }

        // Renders the rune images
        if (image) {
            let off: number = 0;

            for (let y: number = 0; y < image.hi; y++) {
                for (let x: number = 0; x < image.wi; x++) {
                    if (image.data[off++] !== 0) {
                        const x0: number = x + image.xof + 16;
                        const y0: number = y + image.yof + 16;
                        const index: number = x0 + (y0 << 7);
                        this.flameBuffer0[index] = 0;
                    }
                }
            }
        }
    }

    // jag::oldscape::TitleFlames::DrawFlames
    private drawFlames(): void {
        if (!this.flameGradient || !this.flameGradient0 || !this.flameGradient1 || !this.flameGradient2 || !this.flameLineOffset || !this.flameBuffer3) {
            return;
        }

        const height: number = 256;

        // just colours
        if (this.flameGradientCycle0 > 0) {
            for (let i: number = 0; i < 256; i++) {
                if (this.flameGradientCycle0 > 768) {
                    this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient0[i], 1024 - this.flameGradientCycle0, this.flameGradient1[i]);
                } else if (this.flameGradientCycle0 > 256) {
                    this.flameGradient[i] = this.flameGradient1[i];
                } else {
                    this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient1[i], 256 - this.flameGradientCycle0, this.flameGradient0[i]);
                }
            }
        } else if (this.flameGradientCycle1 > 0) {
            for (let i: number = 0; i < 256; i++) {
                if (this.flameGradientCycle1 > 768) {
                    this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient0[i], 1024 - this.flameGradientCycle1, this.flameGradient2[i]);
                } else if (this.flameGradientCycle1 > 256) {
                    this.flameGradient[i] = this.flameGradient2[i];
                } else {
                    this.flameGradient[i] = this.titleFlamesMerge(this.flameGradient2[i], 256 - this.flameGradientCycle1, this.flameGradient0[i]);
                }
            }
        } else {
            for (let i: number = 0; i < 256; i++) {
                this.flameGradient[i] = this.flameGradient0[i];
            }
        }

        for (let i: number = 0; i < 33920; i++) {
            if (this.imageTitle0 && this.imageFlamesLeft) this.imageTitle0.data[i] = this.imageFlamesLeft.data[i];
        }

        let srcOffset: number = 0;
        let dstOffset: number = 1152;

        for (let y: number = 1; y < height - 1; y++) {
            const offset: number = ((this.flameLineOffset[y] * (height - y)) / height) | 0;

            let step: number = offset + 22;
            if (step < 0) {
                step = 0;
            }

            srcOffset += step;

            for (let x: number = step; x < 128; x++) {
                let value: number = this.flameBuffer3[srcOffset++];
                if (value === 0) {
                    dstOffset++;
                } else {
                    const alpha: number = value;
                    const invAlpha: number = 256 - value;
                    value = this.flameGradient[value];

                    if (this.imageTitle0) {
                        const background: number = this.imageTitle0.data[dstOffset];
                        this.imageTitle0.data[dstOffset++] = ((((value & 0xff00ff) * alpha + (background & 0xff00ff) * invAlpha) & 0xff00ff00) + (((value & 0xff00) * alpha + (background & 0xff00) * invAlpha) & 0xff0000)) >> 8;
                    }
                }
            }
            dstOffset += step;
        }

        this.imageTitle0?.draw(0, 0);

        for (let i: number = 0; i < 33920; i++) {
            if (this.imageTitle1 && this.imageFlamesRight) {
                this.imageTitle1.data[i] = this.imageFlamesRight.data[i];
            }
        }

        srcOffset = 0;
        dstOffset = 1176;

        for (let y: number = 1; y < height - 1; y++) {
            const offset: number = ((this.flameLineOffset[y] * (height - y)) / height) | 0;

            const step: number = 103 - offset;
            dstOffset += offset;

            for (let x: number = 0; x < step; x++) {
                let value: number = this.flameBuffer3[srcOffset++];
                if (value === 0) {
                    dstOffset++;
                } else {
                    const alpha: number = value;
                    const invAlpha: number = 256 - value;
                    value = this.flameGradient[value];

                    if (this.imageTitle1) {
                        const background: number = this.imageTitle1.data[dstOffset];
                        this.imageTitle1.data[dstOffset++] = ((((value & 0xff00ff) * alpha + (background & 0xff00ff) * invAlpha) & 0xff00ff00) + (((value & 0xff00) * alpha + (background & 0xff00) * invAlpha) & 0xff0000)) >> 8;
                    }
                }
            }

            srcOffset += 128 - step;
            dstOffset += 128 - step - offset;
        }

        this.imageTitle1?.draw(637, 0);
    }

    // jag::oldscape::TitleFlames::Merge
    private titleFlamesMerge(src: number, alpha: number, dst: number): number {
        const invAlpha: number = 256 - alpha;
        return ((((src & 0xff00ff) * invAlpha + (dst & 0xff00ff) * alpha) & 0xff00ff00) + (((src & 0xff00) * invAlpha + (dst & 0xff00) * alpha) & 0xff0000)) >> 8;
    }

    // ----

    /// touch controls
    private startedInViewport: boolean = false;
    private startedInTabArea: boolean = false;
    private startedInChatScroll: boolean = false;
    private ttime: number = -1;
    // start
    private sx: number = 0;
    private sy: number = 0;
    // mouse
    private mx: number = 0;
    private my: number = 0;
    // new
    private nx: number = 0;
    private ny: number = 0;
    private dragging: boolean = false;
    private panning: boolean = false;

    override pointerDownInner(x: number, y: number, e: PointerEvent) {
        if (MobileKeyboard.isWithinCanvasKeyboard(x, y) && !this.exceedsGrabThreshold(20)) {
            MobileKeyboard.captureMouseDown(x, y);
            return;
        }

        if (e.pointerType !== 'mouse') {
            // custom: touchscreen support
            // we don't acknowledge the first press as a click, instead we interpret the user's gesture on release

            this.idleTimer = performance.now();
            this.nextMouseClickX = -1;
            this.nextMouseClickY = -1;
            this.nextMouseClickButton = 0;
            this.mouseX = x;
            this.mouseY = y;
            this.mouseButton = 0;

            this.sx = this.nx = this.mx = e.screenX | 0;
            this.sy = this.ny = this.my = e.screenY | 0;
            this.ttime = e.timeStamp;

            this.startedInViewport = this.insideViewportArea();
            this.startedInTabArea = this.insideTabArea();
            this.startedInChatScroll = this.insideChatScrollArea();
        }
    }

    override mouseUpInner(x: number, y: number, e: MouseEvent) {
        this.idleTimer = performance.now();
        this.mouseButton = 0;

        if (InputTracking.active) {
            InputTracking.mouseReleased(e.button, 'mouse');
        }

        // custom: up event comes before and potentially without move event
        this.mouseX = x;
        this.mouseY = y;
    }

    override pointerUpInner(x: number, y: number, e: PointerEvent) {
        if (MobileKeyboard.isWithinCanvasKeyboard(x, y) && !this.exceedsGrabThreshold(20)) {
            MobileKeyboard.captureMouseUp(x, y);
            return;
        }

        if (e.pointerType !== 'mouse') {
            // custom: touchscreen support
            // we don't acknowledge the first press as a click, instead we interpret the user's gesture on release

            this.idleTimer = performance.now();
            this.mouseX = x;
            this.mouseY = y;

            if (this.dragging) {
                this.dragging = false;

                this.nextMouseClickX = -1;
                this.nextMouseClickY = -1;
                this.nextMouseClickButton = 0;
                this.mouseButton = 0;

                if (InputTracking.active) {
                    InputTracking.mouseReleased(0, e.pointerType);
                }
            } else if (this.panning) {
                // ignore up events if the player was moving the camera in the viewport
                this.panning = false;

                // release all arrow keys
                this.keyHeld[1] = 0;
                this.keyHeld[2] = 0;
                this.keyHeld[3] = 0;
                this.keyHeld[4] = 0;
                return;
            } else {
                if (!MobileKeyboard.isDisplayed() && this.insideMobileInputArea()) {
                    // show keyboard when tapping in an input area
                    MobileKeyboard.show(x, y, e.clientX, e.clientY);
                } else if (MobileKeyboard.isDisplayed() && !MobileKeyboard.isWithinCanvasKeyboard(x, y)) {
                    // hide keyboard when tapping outside of an input area
                    MobileKeyboard.hide();
                    this.refresh();
                }

                // within click threshold: activate mouse button
                this.nextMouseClickX = x;
                this.nextMouseClickY = y;
                this.nextMouseClickTime = performance.now();

                const longPress: boolean = e.timeStamp >= this.ttime + 500;
                if (longPress) {
                    this.nextMouseClickButton = 2;
                    this.mouseButton = 2;
                } else {
                    this.nextMouseClickButton = 1;
                    this.mouseButton = 1;
                }

                if (InputTracking.active) {
                    InputTracking.mousePressed(x, y, longPress ? 2 : 0, e.pointerType);
                }

                // release after a client cycle has passed
                setTimeout(() => {
                    this.mouseButton = 0;

                    if (InputTracking.active) {
                        InputTracking.mouseReleased(longPress ? 2 : 0, e.pointerType);
                    }
                }, 40);
            }
        }
    }

    override pointerEnterInner(x: number, y: number, e: PointerEvent) {
        if (e.pointerType === 'mouse') {
            this.mouseX = x;
            this.mouseY = y;

            if (InputTracking.active) {
                InputTracking.mouseEntered();
            }
        } else {
            // custom: touchscreen support

            this.idleTimer = performance.now();
            this.nextMouseClickX = -1;
            this.nextMouseClickY = -1;
            this.nextMouseClickButton = 0;
            this.mouseX = x;
            this.mouseY = y;
            this.mouseButton = 0;

            this.sx = this.nx = this.mx = e.screenX | 0;
            this.sy = this.ny = this.my = e.screenY | 0;
            this.ttime = e.timeStamp;

            this.startedInViewport = this.insideViewportArea();
            this.startedInTabArea = this.insideTabArea();
        }
    }

    override pointerLeaveInner(e: PointerEvent) {
        if (e.pointerType === 'mouse') {
            this.idleTimer = performance.now();
            this.mouseX = -1;
            this.mouseY = -1;

            if (InputTracking.active) {
                InputTracking.mouseExited();
            }

            // custom: moving off-canvas may have a stuck mouse event
            this.nextMouseClickX = -1;
            this.nextMouseClickY = -1;
            this.nextMouseClickButton = 0;
            this.mouseButton = 0;
        } else {
            // custom: touchscreen support
            this.idleTimer = performance.now();

            // release all arrow keys
            this.keyHeld[1] = 0;
            this.keyHeld[2] = 0;
            this.keyHeld[3] = 0;
            this.keyHeld[4] = 0;
        }
    }

    override pointerMoveInner(x: number, y: number, e: PointerEvent) {
        if (e.pointerType === 'mouse') {
            this.idleTimer = performance.now();
            this.mouseX = x;
            this.mouseY = y;

            if (InputTracking.active) {
                InputTracking.mouseMoved(x, y, e.pointerType);
            }
        } else {
            // custom: touchscreen support
            this.idleTimer = performance.now();
            this.mouseX = x;
            this.mouseY = y;

            this.nx = e.screenX | 0;
            this.ny = e.screenY | 0;

            if (this.dragging) {
                // no-op
            } else if (MobileKeyboard.isWithinCanvasKeyboard(x, y) && this.exceedsGrabThreshold(20)) {
                MobileKeyboard.notifyTouchMove(x, y);
            } else if (this.startedInViewport && !this.isViewportObscured() && this.exceedsGrabThreshold(20)) {
                // moving camera
                this.panning = true;

                // emulate arrow keys:
                if (this.mx - this.nx > 0) {
                    // right
                    this.keyHeld[1] = 0;
                    this.keyHeld[2] = 1;
                } else if (this.mx - this.nx < 0) {
                    // left
                    this.keyHeld[1] = 1;
                    this.keyHeld[2] = 0;
                }

                if (this.my - this.ny > 0) {
                    // down
                    this.keyHeld[3] = 0;
                    this.keyHeld[4] = 1;
                } else if (this.my - this.ny < 0) {
                    // up
                    this.keyHeld[3] = 1;
                    this.keyHeld[4] = 0;
                }
            } else if (this.startedInTabArea || this.startedInChatScroll || this.isViewportObscured()) {
                if (!this.dragging && this.exceedsGrabThreshold(5)) {
                    this.dragging = true;

                    this.nextMouseClickX = x;
                    this.nextMouseClickY = y;
                    this.nextMouseClickButton = 1;
                    this.mouseButton = 1;
                }
            }

            this.mx = this.nx;
            this.my = this.ny;
        }
    }

    // all mouse logic is done above, this is for controlling canvas behaviors
    override touchStartInner(e: TouchEvent) {
        if (e.touches.length < 2 || this.dragging) {
            // 1 touch - prevent natural browser behavior
            // 2+ touches - allow scrolling/zooming
            e.preventDefault();
        }
    }

    private exceedsGrabThreshold(size: number) {
        return Math.abs(this.sx - this.nx) > size || Math.abs(this.sy - this.ny) > size;
    }

    private isViewportObscured(): boolean {
        return this.mainLayerId !== -1;
    }

    private insideMobileInputArea(): boolean {
        return this.insideChatInputArea() || this.insideChatPopupArea() || this.insideUsernameArea() || this.inPasswordArea() || this.insideReportInterfaceTextArea();
    }

    private insideViewportArea() {
        // 512 x 334
        const viewportAreaX1: number = 4;
        const viewportAreaY1: number = 4;
        const viewportAreaX2: number = viewportAreaX1 + 512;
        const viewportAreaY2: number = viewportAreaY1 + 334;
        return this.ingame && this.mouseX >= viewportAreaX1 && this.mouseX <= viewportAreaX2 && this.mouseY >= viewportAreaY1 && this.mouseY <= viewportAreaY2;
    }

    private insideTabArea() {
        const tabAreaX1: number = 553;
        const tabAreaY1: number = 205;
        const tabAreaX2: number = tabAreaX1 + 190;
        const tabAreaY2: number = tabAreaY1 + 261;
        return this.ingame && this.mouseX >= tabAreaX1 && this.mouseX <= tabAreaX2 && this.mouseY >= tabAreaY1 && this.mouseY <= tabAreaY2;
    }

    private insideChatScrollArea() {
        const chatInputAreaX1: number = 480;
        const chatInputAreaY1: number = 357;
        const chatInputAreaX2: number = chatInputAreaX1 + 16;
        const chatInputAreaY2: number = chatInputAreaY1 + 77;
        return (
            this.ingame &&
            (!this.dialogInputOpen && !this.socialInputOpen) &&
            this.mouseX >= chatInputAreaX1 &&
            this.mouseX <= chatInputAreaX2 &&
            this.mouseY >= chatInputAreaY1 &&
            this.mouseY <= chatInputAreaY2
        );
    }

    private insideChatInputArea() {
        const chatInputAreaX1: number = 17;
        const chatInputAreaY1: number = 434;
        const chatInputAreaX2: number = chatInputAreaX1 + 479;
        const chatInputAreaY2: number = chatInputAreaY1 + 26;
        return (
            this.ingame &&
            this.chatLayerId === -1 &&
            !this.dialogInputOpen &&
            !this.socialInputOpen &&
            this.mouseX >= chatInputAreaX1 &&
            this.mouseX <= chatInputAreaX2 &&
            this.mouseY >= chatInputAreaY1 &&
            this.mouseY <= chatInputAreaY2
        );
    }

    protected insideChatPopupArea() {
        const chatInputAreaX1: number = 17;
        const chatInputAreaY1: number = 357;
        const chatInputAreaX2: number = chatInputAreaX1 + 479;
        const chatInputAreaY2: number = chatInputAreaY1 + 96;
        return (
            this.ingame &&
            (this.dialogInputOpen || this.socialInputOpen) &&
            this.mouseX >= chatInputAreaX1 &&
            this.mouseX <= chatInputAreaX2 &&
            this.mouseY >= chatInputAreaY1 &&
            this.mouseY <= chatInputAreaY2
        );
    }

    private insideReportInterfaceTextArea() {
        // actual component size is [233, 137, 58 14]
        // extended it a little bit for easier interaction, since the area to
        // touch is not obvious (it's a bit narrow)
        if (!this.ingame) {
            return false;
        }

        // either viewport or report-abuse interface Ids are bad
        if (this.mainLayerId === -1 || this.reportAbuseLayerId === -1) {
            return false;
        }

        // active viewport interface Id does not match
        if (this.mainLayerId !== this.reportAbuseLayerId) {
            return false;
        }

        const reportInputAreaX1: number = 87;
        const reportInputAreaY1: number = 119;
        const reportInputAreaX2: number = reportInputAreaX1 + 348;
        const reportInputAreaY2: number = reportInputAreaY1 + 37;
        return this.mouseX >= reportInputAreaX1 && this.mouseX <= reportInputAreaX2 && this.mouseY >= reportInputAreaY1 && this.mouseY <= reportInputAreaY2;
    }

    private insideUsernameArea() {
        const usernameAreaX1: number = 280;
        const usernameAreaY1: number = 233;
        const usernameAreaX2: number = usernameAreaX1 + 190;
        const usernameAreaY2: number = usernameAreaY1 + 31;
        return !this.ingame && this.loginscreen === 2 && this.mouseX >= usernameAreaX1 && this.mouseX <= usernameAreaX2 && this.mouseY >= usernameAreaY1 && this.mouseY <= usernameAreaY2;
    }

    private inPasswordArea() {
        const passwordAreaX1: number = 280;
        const passwordAreaY1: number = 264;
        const passwordAreaX2: number = passwordAreaX1 + 278;
        const passwordAreaY2: number = passwordAreaY1 + 20;
        return !this.ingame && this.loginscreen === 2 && this.mouseX >= passwordAreaX1 && this.mouseX <= passwordAreaX2 && this.mouseY >= passwordAreaY1 && this.mouseY <= passwordAreaY2;
    }

    // Custom client methods

    manhattanDist(currentX: number, currentZ: number, targetX: number, targetZ: number): number {
        const dx = currentX - targetX;
        const dy = currentZ - targetZ;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist;
    }

    getNearestObjectFromArray(targetids: number[], maxdist = 1000) {
        if (this.localPlayer == null) {
            return null;
        }
        let playerX = this.localPlayer.routeX[0];
        let playerZ = this.localPlayer.routeZ[0];
        let closestDist = Number.POSITIVE_INFINITY;
        let closestX = -1;
        let closestZ = -1;
        let closestFullType = -1;
        let s = this.world;
        if (!s) {return null;}
        for (let x = 0; x < CollisionConstants.SIZE; x++) {
            for (let z = 0; z < CollisionConstants.SIZE; z++) {
                let tile = s.sceneType(this.minusedlevel, x, z);
                if (tile == 0) {
                    continue;
                }
                let type = (tile >> 14) & 32767;
                if (targetids.includes(type)) {
                    let dist = this.manhattanDist(playerX, playerZ, x, z);
                    if (dist < closestDist && dist < maxdist) {
                        closestDist = dist;
                        closestX = x;
                        closestZ = z;
                        closestFullType = tile;
                    }
                    // console.log(`Found tile ${tile} at ${[this.currentLevel, x, z]} with type ${type}.`);
                }
            }
        }
        if (closestX == -1 || closestZ == -1 || !this.localPlayer) {
            return null;
        } else {
            return {level: this.minusedlevel, x: closestX, z: closestZ, fullType: closestFullType};
        }
    }

    useNearestObjOPN(n: number, ids: number[], maxdist: number) {
        let nearestObj = this.getNearestObjectFromArray(ids, maxdist);
        if (!nearestObj) {
            this.addChat(0, `Failed to find a nearest object of ${ids} within ${maxdist} dist.`, '');
            return false;
        }
        let a = nearestObj.fullType;
        let b = nearestObj.x;
        let c = nearestObj.z;
        if (n == 1) {
            this.interactWithLoc(ClientProt.OPLOC1, b, c, a);
        } else if (n == 2) {
            this.interactWithLoc(ClientProt.OPLOC2, b, c, a);
        } else if (n == 3) {
            this.interactWithLoc(ClientProt.OPLOC3, b, c, a);
        } else {
            console.error(`Invalid n=${n} call to useNearestObjOPN.`);
        }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
        return true;
    }

    checkBankOpen() {
        let bank = IfType.list[this.bankComponentId];
        if (!bank || !bank.linkObjType || bank.linkObjType[0] == 0) {
            console.log('Bank data not available or bank is empty.');
            return false;
        } else {
            return true;
        }
    }

    async openBankNoMouse(boothObjId = 2213, maxDist = 10) {
        this.useNearestObjOPN(2, [boothObjId], maxDist);
        await sleep(2000);
        for (var _ = 0; _ < 10 && !this.checkBankOpen(); _++) await sleep(500);
    }

    /**
     * Pass the actual ids, not +1
    */
    depositAllSingleSlot(slot: number, itemId: number){
        let action: number = 892;
        const a: number = itemId;
        const b: number = slot;
        const c: number = 2006;
        if (action === 892) {
            if ((b & 0x3) === 0) {
                Client.oplogic9++;
            }

            if (Client.oplogic9 >= 130) {
                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC9);
                this.out.p1(177);
            }

            this.out.pIsaac(ClientProt.INV_BUTTON4);
        }
        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
    }

    async depositAllExceptNoMouse(itemIds: number[]) {
        // Pass the actual ids, not +1
        await this.openBankNoMouse();

        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            console.error('Inventory data not available');
            return false;
        }
        
        // (+1 offset)
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (inv.linkObjType[slot] == 0) continue; // Skip empty slots
            let objId = inv.linkObjType[slot] - 1;
            if (!itemIds.includes(objId)) {
                this.depositAllSingleSlot(slot, objId);
                await sleep(300);
            }
        }
        return true;
    }

    /**
     * Pass the actual ids, not +1
    */
    withdrawAllSingleSlot(slot: number, itemId: number){
        let action: number = 892;
        const a: number = itemId;
        const b: number = slot;
        const c: number = 5382;
        if (action === 892) {
            if ((b & 0x3) === 0) {
                Client.oplogic9++;
            }

            if (Client.oplogic9 >= 130) {
                this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC9);
                this.out.p1(177);
            }

            this.out.pIsaac(ClientProt.INV_BUTTON4);
        }
        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
    }

    async withdrawAllNoMouse(id: number) {
        let inv = IfType.list[this.bankComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (id == (inv.linkObjType[slot] - 1)) {
                this.withdrawAllSingleSlot(slot, id);
                await sleep(700);
                return true;
            }
        }
        return false;
    }

    withdraw5SingleSlot(slot: number, itemId: number){
        let action: number = 596;
        const a: number = itemId;
        const b: number = slot;
        const c: number = 5382;
        if (action === 596) {
            this.out.pIsaac(ClientProt.INV_BUTTON2);
        }
        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
    }

    async withdraw5NoMouse(id: number) {
        let inv = IfType.list[this.bankComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (id == (inv.linkObjType[slot] - 1)) {
                this.withdraw5SingleSlot(slot, id);
                await sleep(700);
                return true;
            }
        }
        return false;
    }

    invCount(): number {
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return -1;
        }
        let cnt = 0;
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (inv.linkObjType[slot] != 0) {
                cnt++;
            }
        }
        return cnt;
    }

    invFull(): boolean {
        return this.invCount() == 28;
    }

    countInvById(id: number): number {
        var cnt = 0;
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType || !inv.linkObjCount) {
            this.addChat?.(0, 'Inventory data not available', '');
            return 0;
        }
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (id == (inv.linkObjType[slot] - 1)) {
                cnt = cnt + inv.linkObjCount[slot];
            }
        }
        return cnt;
    }

    /**
     * Bounds are W, E, S, N
     */
    playerIsInBounds(bounds: number[]) {
        let globalX = (this.localPlayer?.routeX[0] ?? 0) + this.mapBuildBaseX;
        let globalZ = (this.localPlayer?.routeZ[0] ?? 0) + this.mapBuildBaseZ;
        return globalX >= bounds[0] && globalX <= bounds[1] && globalZ >= bounds[2] && globalZ <= bounds[3]
    }

    getNearestNPC(needle: string) {
        let closestDist = Number.POSITIVE_INFINITY;
        let closestNpc: { x: number, z: number, entity: ClientEntity, npc: ClientNpc, npcsIndex: number } | null = null;

        for (let index: number = 0; index < this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            entity = this.npc[this.npcIds[index]];
            if (!entity) {
                continue;
            }
            let npcsi = this.npcIds[index];
            const npc: ClientNpc = entity as ClientNpc;
            let npcname: string = '' + npc.type?.name;
            if (npcname.match(needle) && this.localPlayer) {
                const dx = this.localPlayer?.routeX[0] - npc.routeX[0];
                const dz = this.localPlayer?.routeZ[0] - npc.routeZ[0];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestNpc = { x: npc.routeX[0], z: npc.routeZ[0], entity, npc, npcsIndex: npcsi };
                }
            }
        }
        return closestNpc;
    }

    getNearestNPCInBounds(needle: string, west: number, east: number, south: number, north: number, maxdist: number) {
        let closestDist = Number.POSITIVE_INFINITY;
        let closestNpc: { x: number, z: number, entity: ClientEntity, npc: ClientNpc, npcsIndex: number } | null = null;

        for (let index: number = 0; index < this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            entity = this.npc[this.npcIds[index]];
            if (!entity) {
                continue;
            }
            let npcsi = this.npcIds[index];
            const npc: ClientNpc = entity as ClientNpc;
            let npcname: string = '' + npc.type?.name;
            let npcx = (npc?.routeX[0] ?? 0) + this.mapBuildBaseX;
            let npcz = (npc?.routeZ[0] ?? 0) + this.mapBuildBaseZ;
            if (npcx < west || npcx > east || npcz > north || npcz < south) {
                continue;
            }
            if (npcname.match(needle) && this.localPlayer) {
                const dx = this.localPlayer?.routeX[0] - npc.routeX[0];
                const dz = this.localPlayer?.routeZ[0] - npc.routeZ[0];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < closestDist && dist < maxdist) {
                    closestDist = dist;
                    closestNpc = { x: npc.routeX[0], z: npc.routeZ[0], entity, npc, npcsIndex: npcsi };
                }
            }
        }
        return closestNpc;
    }

    async attackNearestNPC(needle: string) {
        let nearestNPC = this.getNearestNPC(needle);
        if (nearestNPC && this.localPlayer) {
            let a = nearestNPC.npcsIndex;
            const npc: ClientNpc | null = this.npc[a];
            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
                let action = 542;
                if (action === 542) {
                    this.out.pIsaac(ClientProt.OPNPC2);
                }
                this.out.p2(a);
            }
        }
        await sleep(200);
    }

    async attackNearestNPCInBounds(needle: string, west: number, east: number, south: number, north: number, maxdist: number) {
        let nearestNPC = this.getNearestNPCInBounds(needle, west, east, south, north, maxdist);
        if (nearestNPC && this.localPlayer) {
            let a = nearestNPC.npcsIndex;
            const npc: ClientNpc | null = this.npc[a];
            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
                let action = 542;
                if (action === 542) {
                    this.out.pIsaac(ClientProt.OPNPC2);
                }
                this.out.p2(a);
            }
        }
        await sleep(200);
    }

    getNearestNPCAfterMe(needle: string) {
        let closestDist = Number.POSITIVE_INFINITY;
        let closestNpc: { x: number, z: number, entity: ClientEntity, npc: ClientNpc, npcsIndex: number } | null = null;

        for (let index: number = 0; index < this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            entity = this.npc[this.npcIds[index]];
            if (!entity) {
                continue;
            }
            let npcsi = this.npcIds[index];
            const npc: ClientNpc = entity as ClientNpc;
            let npcname: string = '' + npc.type?.name;
            if (npcname.match(needle) && this.localPlayer && this.afterMe(npc)) {
                const dx = this.localPlayer?.routeX[0] - npc.routeX[0];
                const dz = this.localPlayer?.routeZ[0] - npc.routeZ[0];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestNpc = { x: npc.routeX[0], z: npc.routeZ[0], entity, npc, npcsIndex: npcsi };
                }
            }
        }
        return closestNpc;
    }

    async attackNearestNPCAfterMe(needle: string) {
        let nearestNPC = this.getNearestNPCAfterMe(needle);
        if (nearestNPC && this.localPlayer) {
            let a = nearestNPC.npcsIndex;
            const npc: ClientNpc | null = this.npc[a];
            if (npc && this.localPlayer) {
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], npc.routeX[0], npc.routeZ[0], 2, 1, 1, 0, 0, 0, false);
                let action = 542;
                if (action === 542) {
                    this.out.pIsaac(ClientProt.OPNPC2);
                }
                this.out.p2(a);
            }
        }
        await sleep(200);
    }

    async reportXPOnInterval(stat: number, intervalms: number, statname: string = '') {
        let initialXP = this.statXP[stat];
        this.addChat(0, `Beginning ${statname} XP: ${initialXP}`, '');
        let initialTime = performance.now();
        let reportTime = initialTime + intervalms;
        while (!this.stopLoop) {
            let currentTime = performance.now();
            if (currentTime > reportTime) {
                reportTime += intervalms;
                let currentXP = this.statXP[stat];
                let elapsedHours = ((currentTime - initialTime) / 60 / 60 / 1000);
                this.addChat(0, `Gained ${statname} XP: ${currentXP - initialXP}. XP/hr: ${((currentXP - initialXP) / elapsedHours).toFixed(1)}`, '');
                this.addChat(0, `Hours elapsed: ${elapsedHours.toFixed(3)}`, '');
            }
            await sleep(3000);
        }
    }

    findNearestPointInPath(path: Array<Array<number>>) {
        let globalX = (this.localPlayer?.routeX[0] ?? 0) + this.mapBuildBaseX;
        let globalZ = (this.localPlayer?.routeZ[0] ?? 0) + this.mapBuildBaseZ;
        var closestDist = Number.POSITIVE_INFINITY;
        var closestPoint: Array<number> = [];
        var closestPointIndex = -1;
        for (let i = 0; i < path.length; i++) {
            let point = path[i];
            let dx = point[0] - globalX;
            let dz = point[1] - globalZ;
            let dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closestPoint = point;
                closestPointIndex = i;
            }
        }
        if (closestPointIndex == -1) {
            console.error(`No closest point found in path ${JSON.stringify(path)}`);
            return null;
        } else {
            return { point: closestPoint, index: closestPointIndex };
        }
    }

    async walkToEndofPath(path: number[][]) {
        const result = this.findNearestPointInPath(path);
        if (!result || !this.localPlayer) {
            return;
        }
        const { point, index } = result;
        for (let i = index; i < path.length; i++) {
            let p = path[i];
            if (this.localPlayer.routeX[0] != p[0] - this.mapBuildBaseX || this.localPlayer.routeZ[0] != p[1] - this.mapBuildBaseZ) {
                console.log(`Trying to move to ${p[0] - this.mapBuildBaseX}, ${p[1] - this.mapBuildBaseZ}; ${i+1} / ${path.length}`);
                this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], p[0] - this.mapBuildBaseX, p[1] - this.mapBuildBaseZ, 0, 0, 0, 0, 0, 0, true)
                // Wait until we've started moving
                for (let i = 0; i < 15; i++) {
                    await sleep(100);
                    if (this.localPlayer?.routeLength !== 0) {
                        break;
                    }
                }
                await sleep(200);
                // Wait until we've stopped moving
                while (this.localPlayer?.routeLength !== 0) {
                    await sleep(300);
                }
            } else {
                console.log(`Already there, don't need to move to ${p[0] - this.mapBuildBaseX}, ${p[1] - this.mapBuildBaseZ}; ${i+1} / ${path.length}`);
                await sleep(200);
            }
        
        }
    }

    async setAttackRapid() {
        // action=225, a=361, b=0, c=4453
        let action = MenuAction.IF_BUTTON_SELECT; // 225
        let a = 361; // not used?
        let b = 0; // not used?
        let c = 4453;
        this.out.pIsaac(ClientProt.IF_BUTTON);
        this.out.p2(c);

        const com: IfType = IfType.list[c];
        if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
            const varp: number = com.scripts[0][1];
            if (com.scriptOperand && this.var[varp] !== com.scriptOperand[0]) {
                this.var[varp] = com.scriptOperand[0];
                this.updateVarp(varp);
                this.redrawSidebar = true;
            }
        }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    async handleRunEnergy(minenergy = 30): Promise<boolean> {
        if (this.runenergy > minenergy) {
            let c = 153;

            this.out.pIsaac(ClientProt.IF_BUTTON);
            this.out.p2(c);

            const com: IfType = IfType.list[c];
            if (com.scripts && com.scripts[0] && com.scripts[0][0] === 5) {
                const varp: number = com.scripts[0][1];
                if (com.scriptOperand && this.var[varp] !== com.scriptOperand[0]) {
                    this.var[varp] = com.scriptOperand[0];
                    this.updateVarp(varp);
                    this.redrawSidebar = true;
                }
            }
            this.objSelected = 0;
            this.spellSelected = 0;
            this.redrawSidebar = true;
            return true;
        }
        return false;
    }

    async handleRunEnergyThrottled(minutes: number) {
        const now = Date.now();
        if (!this.lastCheckRunTime || now - this.lastCheckRunTime >= minutes * 60 * 1000) {
            await this.handleRunEnergy();
            this.lastCheckRunTime = now;
        }
    }

    afterMe(npc: ClientEntity) {
        if (npc && this.localPlayer) {
            if (npc.faceEntity - 32768 == this.localPid) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    anyNPCafterMe() {
        for (let index: number = 0; index < this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            entity = this.npc[this.npcIds[index]];
            if (!entity) {
                continue;
            }
            const npc: ClientNpc = entity as ClientNpc;
            if (this.afterMe(npc)) {
                return true;
            }
        }
        return false;
    }

    eatFoodSingleSlot(slot: number, itemId: number) {
        let action = 405;
        let a = itemId;
        let b = slot;
        let c = 3214;

        Client.oplogic3 += a;
        if (Client.oplogic3 >= 97) {
            this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC3);
            this.out.p3(14953816);
        }

        this.out.pIsaac(ClientProt.OPHELD1);

        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    eatFoodInv(itemId: number) {
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }
        
        // (+1 offset)
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (inv.linkObjType[slot] == 0) continue; // Skip empty slots
            let objId = inv.linkObjType[slot] - 1;
            if (itemId == objId) {
                this.eatFoodSingleSlot(slot, itemId);
                return true;
            }
        }
        return false;
    }

    equipItemSingleSlot(slot: number, itemId: number) {
        let action = 38;
        let a = itemId;
        let b = slot;
        let c = 3214;
        this.out.pIsaac(ClientProt.OPHELD2);

        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    equipItemInv(itemId: number) {
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }
        
        // (+1 offset)
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (inv.linkObjType[slot] == 0) continue; // Skip empty slots
            let objId = inv.linkObjType[slot] - 1;
            if (itemId == objId) {
                this.equipItemSingleSlot(slot, itemId);
                break;
            }
        }
        return true;
    }

    async buryBones(itemIds: number[]) {
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }

        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            let itemId = inv.linkObjType[slot] - 1;
            if (itemIds.includes(itemId)) {
                let c = 3214;
                let b = slot;
                let a = itemId;
                // Client.oplogic3 += a;
                // if (Client.oplogic3 >= 97) {
                //     this.out.pIsaac(ClientProt.ANTICHEAT_OPLOGIC3);
                //     this.out.p3(14953816);
                // }

                this.out.pIsaac(ClientProt.OPHELD1);
                this.out.p2(a);
                this.out.p2(b);
                this.out.p2(c);

                this.selectedCycle = 0;
                this.selectedLayerId = c;
                this.selectedItem = b;
                this.selectedArea = 2;

                if (IfType.list[c].layerId === this.mainLayerId) {
                    this.selectedArea = 1;
                }

                if (IfType.list[c].layerId === this.chatLayerId) {
                    this.selectedArea = 3;
                }

                this.objSelected = 0;
                this.spellSelected = 0;
                this.redrawSidebar = true;
                await sleep(1300);
            }
        }
        return true;
    }

    filterGroundItemsIds(items: number[]): number[] {
        const foundIds = new Set<number>();
        for (let x = 0; x < CollisionConstants.SIZE; x++) {
            for (let z = 0; z < CollisionConstants.SIZE; z++) {
                let objs = this.objStacks[this.minusedlevel][x][z];
                if (!objs) continue;
                for (let obj: ClientObj | null = objs.tail() as ClientObj | null; obj; obj = objs.prev() as ClientObj | null) {
                    const type: ObjType = ObjType.get(obj.id);
                    foundIds.add(type.id);
                }
            }
        }
        return items.filter(item => foundIds.has(item));
    }

    async pickupNearestIdNoMouse(targetid: number) {
        if (this.localPlayer == null) {
            return false;
        }
        let playerX = this.localPlayer.routeX[0];
        let playerZ = this.localPlayer.routeZ[0];
        let closestDist = Number.POSITIVE_INFINITY;
        let closestX = -1;
        let closestZ = -1;
        let closestObjIndex = -1;
        for (let x = 0; x < CollisionConstants.SIZE; x++) {
            for (let z = 0; z < CollisionConstants.SIZE; z++) {
                let objs = this.objStacks[this.minusedlevel][x][z];
                if (!objs) continue;
                for (let obj: ClientObj | null = objs.tail() as ClientObj | null; obj; obj = objs.prev() as ClientObj | null) {
                    const type: ObjType = ObjType.get(obj.id);
                    if (type.id == targetid) {
                        let dist = this.manhattanDist(playerX, playerZ, x, z);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestX = x;
                            closestZ = z;
                            closestObjIndex = obj.id;
                        }
                    }
                }
            }
        }
        if (closestX == -1 || closestZ == -1 || closestObjIndex == -1 || !this.localPlayer) {
            return false;
        }

        let action = 99;
        let a = closestObjIndex;
        let b = closestX;
        let c = closestZ;
        console.log(`${action}, ${a}, Trying to move with the following: ${[this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c]}`);
        const success: boolean = this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 0, 0, 0, 0, 0, false);
        if (!success) {
            this.tryMove(this.localPlayer.routeX[0], this.localPlayer.routeZ[0], b, c, 2, 1, 1, 0, 0, 0, false);
        }

        this.crossX = this.mouseClickX;
        this.crossY = this.mouseClickY;
        this.crossMode = 2;
        this.crossCycle = 0;

        if (action === 99) {
            this.out.pIsaac(ClientProt.OPOBJ3);
        } else if (action === 993) {
            this.out.pIsaac(ClientProt.OPOBJ2);
        } else if (action === 224) {
            this.out.pIsaac(ClientProt.OPOBJ1);
        } else if (action === 877) {
            this.out.pIsaac(ClientProt.OPOBJ5);
        } else if (action === 746) {
            this.out.pIsaac(ClientProt.OPOBJ4);
        }

        this.out.p2(b + this.mapBuildBaseX);
        this.out.p2(c + this.mapBuildBaseZ);
        this.out.p2(a);
        return true;
    }

    async pickupNearestIdValidated(targetid: number, waitseconds: number = 20) {
        // Check we have at least one free inventory space
        if (this.invFull()) {return false;}
        // Count current number of objects in inventory (what if stackable?), save in variable
        const originalCount = this.countInvById(targetid);
        // Try pickup
        let pickupAttempted = await this.pickupNearestIdNoMouse(targetid);
        if (!pickupAttempted) {return false;}
        // Wait until latest count of items is greater than saved variable, or X secs has passed and fail
        for (let i = 0; i < waitseconds; i++) {
            let currentCount = this.countInvById(targetid);
            if (currentCount > originalCount) {return true;}
            await sleep(1000);
        }
        return false;
    }

    useLogoutButton() {
        // Using menu item 1 with action=231, a=205, b=16, c=2458
        let action = MenuAction.IF_BUTTON; // 231
        let a = 205; // not used?
        let b = 16; // not used?
        let c = 2458;
        const com: IfType = IfType.list[c];
            let notify: boolean = true;

            if (com.clientCode > 0) {
                notify = this.handleInterfaceAction(com);
            }

            if (notify) {
                this.out.pIsaac(ClientProt.IF_BUTTON);
                this.out.p2(c);
            }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    async logoutThenLogin() {
        console.log('Attempting to log out');
        // await this.logout();
        this.useLogoutButton();
        await sleep(10000);
        console.log('Done waiting 10 seconds. Attempting to login.');
        this.loginscreen = 2;
        await this.login('player', 'player', false);
        await sleep(10000);
        console.log('Done waiting 10 seconds. Confirming ingame');
        if (this.ingame) {
            console.log('Confirmd in game');
        } else {
            console.error('Not in game, setting stopLoop');
            this.stopLoop = true;
        }
    }

    async logoutThenLoginThrottled(minutes: number) {
        const currentTime = performance.now();
        if (!this.lastLogoutTime || currentTime - this.lastLogoutTime >= minutes * 60 * 1000) {
            await this.logoutThenLogin();
            this.lastLogoutTime = performance.now();
        } else {
            console.log('Not enough time has elapsed for logout login');
        }
    }

    selectInvSingleSlot(slot: number, itemId: number) {
        // Using menu item 3 with action=102, a=2351, b=1, c=3214
        let action = MenuAction.OPHELDT_START; // 102
        let a = itemId;
        let b = slot;
        let c = 3214;
        this.objSelected = 1;
        this.objSelectedSlot = b;
        this.objSelectedLayerId = c;
        this.objLayerId = a;
        this.objSelectedName = ObjType.get(a).name;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    selectFirstInv(itemId: number) {
        let inv = IfType.list[this.inventoryComponentId];
        if (!inv || !inv.linkObjType) {
            this.addChat?.(0, 'Inventory data not available', '');
            return false;
        }
        
        // (+1 offset)
        for (let slot = 0; slot < inv.linkObjType.length; slot++) {
            if (inv.linkObjType[slot] == 0) continue; // Skip empty slots
            let objId = inv.linkObjType[slot] - 1;
            if (itemId == objId) {
                this.selectInvSingleSlot(slot, itemId);
                break;
            }
        }
        return true;
    }

    /* NOT TESTED */
    getNearestObject(objId: number) {
        if (this.localPlayer == null) {
            return null;
        }
        let playerX = this.localPlayer.routeX[0];
        let playerZ = this.localPlayer.routeZ[0];
        let closestDist = Number.POSITIVE_INFINITY;
        let closestX = -1;
        let closestZ = -1;
        let closestFullType = -1;
        let s = this.world;
        if (!s) {return null;}
        for (let x = 0; x < CollisionConstants.SIZE; x++) {
            for (let z = 0; z < CollisionConstants.SIZE; z++) {
                let tile = s.sceneType(this.minusedlevel, x, z);
                if (tile == 0) {
                    continue;
                }
                let type = (tile >> 14) & 32767;
                if (type == objId) {
                    let dist = this.manhattanDist(playerX, playerZ, x, z);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestX = x;
                        closestZ = z;
                        closestFullType = tile;
                    }
                    console.log(`Found tile ${tile} at ${[this.minusedlevel, x, z]} with type ${type}.`);
                }
            }
        }
        if (closestX == -1 || closestZ == -1 || !this.localPlayer) {
            return null;
        } else {
            return {level: this.minusedlevel, x: closestX, z: closestZ, fullType: closestFullType};
        }
    }

    useOnNearestObj(objId: number) {
        let nearestObj = this.getNearestObjectFromArray([objId]);
        if (!nearestObj) {
            return false;
        }
        let a = nearestObj.fullType;
        let b = nearestObj.x;
        let c = nearestObj.z;
        if (this.interactWithLoc(ClientProt.OPLOCU, b, c, a)) {
            this.out.p2(this.objLayerId);
            this.out.p2(this.objSelectedSlot);
            this.out.p2(this.objSelectedLayerId);
        }
        this.objSelected = 0;
        this.spellSelected = 0;
        this.redrawSidebar = true;
    }

    selectAndUseOnNearest(itemId: number, objId: number) {
        this.selectFirstInv(itemId);
        this.useOnNearestObj(objId);
    }
    
    useInvButton3(a: number, b: number, c: number) {
        this.out.pIsaac(ClientProt.INV_BUTTON3);
        this.out.p2(a);
        this.out.p2(b);
        this.out.p2(c);

        this.selectedCycle = 0;
        this.selectedLayerId = c;
        this.selectedItem = b;
        this.selectedArea = 2;

        if (IfType.list[c].layerId === this.mainLayerId) {
            this.selectedArea = 1;
        }

        if (IfType.list[c].layerId === this.chatLayerId) {
            this.selectedArea = 3;
        }
    }

    async blinkBackground(times = 10) {
        for (let _ = 0; _ < times; _++) {
            document.body.style.backgroundColor = 'red';
            await sleep(200);
            document.body.style.backgroundColor = ''; // Reset to original
            await sleep(200);
        }
    }

    getHPNearestNPCAfterMe(needle: string) {
        let closestDist = Number.POSITIVE_INFINITY;
        let closestNpc: ClientNpc | null = null;

        for (let index: number = 0; index < this.npcCount; index++) {
            let entity: ClientEntity | null = null;
            entity = this.npc[this.npcIds[index]];
            if (!entity) {
                continue;
            }
            let npcsi = this.npcIds[index];
            const npc: ClientNpc = entity as ClientNpc;
            let npcname: string = '' + npc.type?.name;
            if (npcname.match(needle) && this.localPlayer && this.afterMe(npc)) {
                const dx = this.localPlayer?.routeX[0] - npc.routeX[0];
                const dz = this.localPlayer?.routeZ[0] - npc.routeZ[0];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestNpc = npc;
                }
            }
        }
        if (closestNpc != null) {
            return closestNpc.health;
        } else {
            return 0;
        }
    }

    async blinkIfNPCLowHP(needle: string, lowHP: number = 15) {
        this.stopLoop = false;
        while (!this.stopLoop) {
            await sleep(600);
            let currentHP = this.getHPNearestNPCAfterMe(needle);
            if (currentHP === 0) {
                continue;
            }
            this.addChat(0, `HP of ${needle} is ${currentHP}`, '');
            if (currentHP < lowHP) {
                await this.blinkBackground();
            }
        }
    }

    async onF1Pressed_killLesserDemonWizTower() {
        this.addChat(0, 'Beginning onF1Pressed_killLesserDemonWizTower', '');
        this.stopLoop = false;
        this.reportXPOnInterval(PlayerStat.MAGIC, 60_000, 'Magic');
        let needle = 'Lesser demon';
        
        while (!this.stopLoop) {
            await this.attackNearestNPC(needle);
            await sleep(5000);
            // No loginlogout here -- did I ever run into the issue?
        }
    }

    async onF1Pressed_killChaosDruidsArdyRange() {
        this.addChat(0, 'Beginning onF1Pressed_killChaosDruidsArdyRange', '');
        this.stopLoop = false;
        this.reportXPOnInterval(PlayerStat.RANGED, 60_000, 'Ranged');
        let minHP = 25;
        let foodId = 361; // Tuna == 361
        let bonesId = 526; // Bones == 526
        let rangeAmmoId = 863; // iron knife = 863
        let state = 'banking';
        let outsideRoomToBankPath = [[2565, 3356], [2581, 3351], [2582, 3367], [2606, 3365], [2614, 3350], [2615, 3332]];
        let bankToOutsideRoomPath = outsideRoomToBankPath.toReversed();
        let roomBounds = [2560, 2564, 3355, 3358]; // W, E, S, N
        let needle = 'Chaos druid';
        let insideGateP = [2564, 3356];
        let pickupItems = [
            526, // bones
            995, // coins
            227, // vial_water
            231, // snape_grass
            // 1594, // unholy_symbol_mould
            rangeAmmoId,
        ];
        pickupItems = pickupItems.concat(this.uidHerbIds);
        pickupItems = pickupItems.concat(this.rareTableIds);
        pickupItems = pickupItems.concat(this.rangedAmmoIds);
        pickupItems = pickupItems.concat(this.magicRunesIds);
        

        if (this.playerIsInBounds(roomBounds)) {
            state = 'not banking';
        }

        function pickDoor(obj: Client) {
            // action = 504;
            let b = 2565 - obj.mapBuildBaseX;
            let c = 3356 - obj.mapBuildBaseZ;
            let a = obj.world?.wallType(obj.minusedlevel, b, c) ?? 0;
            obj.interactWithLoc(ClientProt.OPLOC2, b, c, a);
            obj.objSelected = 0;
            obj.spellSelected = 0;
            obj.redrawSidebar = true;
        }

        function openDoorFromInside(obj: Client) {
            // action = 285;
            let b = 2565 - obj.mapBuildBaseX;
            let c = 3356 - obj.mapBuildBaseZ;
            let a = obj.world?.wallType(obj.minusedlevel, b, c) ?? 0;
            obj.interactWithLoc(ClientProt.OPLOC1, b, c, a);
            obj.objSelected = 0;
            obj.spellSelected = 0;
            obj.redrawSidebar = true;
        }
        
        while (!this.stopLoop) {
            if (state == 'banking') {
                if (this.playerIsInBounds(roomBounds)) {
                    await this.walkToEndofPath([insideGateP]);
                    await sleep(2000);
                    openDoorFromInside(this);
                    await sleep(3500);
                }
                await this.walkToEndofPath(outsideRoomToBankPath);
                await sleep(2000);
                console.log('Just got back to the bank. Checking logout login');
                await this.logoutThenLoginThrottled(60); // do it every hour
                await sleep(700);
                // Reset attack method to "Rapid"
                this.setAttackRapid();
                await sleep(700);
                await this.depositAllExceptNoMouse([0]);
                await sleep(600);
                if (this.checkBankOpen()) {
                    // withdraw immediately
                    await this.withdraw5NoMouse(foodId);
                }
                await sleep(1200);
                if (this.invCount() == 0) {
                    console.log('Not enough food. Logging out.');
                    this.stopLoop = true;
                    await this.logout();
                }
                await this.walkToEndofPath(bankToOutsideRoomPath);
                await sleep(1200);
                while (!this.playerIsInBounds(roomBounds)) {
                    pickDoor(this);
                    await sleep(2100);
                }
                state = 'not banking';
                this.addChat(0, 'Finished banking state', '');
            }
            await this.handleRunEnergyThrottled(1);
            if (!this.anyNPCafterMe()) {
                // Eat if HP is low
                if (this.statEffectiveLevel[3] < minHP) {
                    let foundFood = this.eatFoodInv(foodId);
                    if (!foundFood) {
                        // out of food, need to bank
                        state = 'banking';
                        this.addChat(0, 'Entering banking state', '');
                        continue;
                    }
                    await sleep(1000);
                    continue; // Restart the outer while loop.
                }
                await sleep(1400); // wait for NPC death animation.
                // Try to pick up any items on the ground.
                let items = this.filterGroundItemsIds(pickupItems);
                while (items.length > 0) {
                    const item = items.shift();
                    if (item != null) {
                        await this.pickupNearestIdValidated(item);
                        if (this.countInvById(bonesId) > 0) {
                            await this.buryBones([bonesId]);
                            await sleep(700);
                        }
                    }
                    if (this.invFull()) {
                        break;
                    }
                    items = this.filterGroundItemsIds(pickupItems);
                }
                if (this.invFull()) {
                    // Handle full inventory, maybe bank.
                    this.equipItemInv(rangeAmmoId);
                    await sleep(700);
                    if (this.countInvById(bonesId) > 0) {
                        await this.buryBones([bonesId]);
                        continue;
                    } else {
                        // No bones, so inv full of other stuff, need to bank.
                        state = 'banking';
                        this.addChat(0, 'Entering banking state', '');
                        continue;
                    }
                }
                await this.attackNearestNPC(needle);
                // Wait until we're actually in combat until trying to loop again.
                let iter = 0;
                while (!this.anyNPCafterMe() && iter < 20) {
                    iter++;
                    await sleep(300);
                }
            } else {
                await this.attackNearestNPCAfterMe(needle);
            }
            await sleep(1200);
        }
    }

    async onF1Pressed_killMossGiantsArdyRange() {
        this.addChat(0, 'Beginning onF1Pressed_killChaosDruidsArdyRange', '');
        this.stopLoop = false;
        this.reportXPOnInterval(PlayerStat.RANGED, 60_000, 'Ranged');
        let minHP = 50;
        let foodId = 361; // Tuna == 361
        let bonesId = 532; // Bones == 532
        let rangeAmmoId = 863; // iron knife = 863
        let state = 'banking';
        let needle = 'Moss giant';
        let safeSpot = [2552, 3407];
        let safeSpotToBankPath = [[2552,3407],[2560,3396],[2570,3387],[2583,3380],[2592,3373],[2604,3366],[2613,3353],[2616,3338],[2615,3332]];
        let bankToSafeSpotPath = safeSpotToBankPath.toReversed();
        let safeSpotBounds = [2552, 2552, 3407, 3407]; // W, E, S, N
        let attackNPCBounds = [2544, 2560, 3405, 3412]; // W, E, S, N

        let pickupItems = [
            532, // big bones
            995, // coins
            2353, // steel bar
            453, // coal
            rangeAmmoId,
        ];
        pickupItems = pickupItems.concat(this.uidHerbIds);
        pickupItems = pickupItems.concat(this.rareTableIds);
        pickupItems = pickupItems.concat(this.rangedAmmoIds);
        pickupItems = pickupItems.concat(this.magicRunesIds);

        if (this.playerIsInBounds(safeSpotBounds)) {
            state = 'not banking';
        }

        while (!this.stopLoop) {
            if (state == 'banking') {
                await this.walkToEndofPath(safeSpotToBankPath);
                await sleep(2000);
                console.log('Just got back to the bank. Checking logout login');
                await this.logoutThenLoginThrottled(60); // do it every hour
                await sleep(700);
                // Reset attack method to "Rapid"
                this.setAttackRapid();
                await sleep(700);
                await this.depositAllExceptNoMouse([0]);
                await sleep(600);
                if (this.checkBankOpen()) {
                    // withdraw immediately
                    await this.withdraw5NoMouse(foodId);
                }
                await sleep(1200);
                if (this.invCount() == 0) {
                    console.log('Not enough food. Logging out.');
                    this.stopLoop = true;
                    await this.logout();
                }
                await this.walkToEndofPath(bankToSafeSpotPath);
                await sleep(1200);
                state = 'not banking';
                this.addChat(0, 'Finished banking state', '');
            }
            await this.handleRunEnergyThrottled(1);
            if (!this.anyNPCafterMe()) {
                // Eat if HP is low
                if (this.statEffectiveLevel[3] < minHP) {
                    let foundFood = this.eatFoodInv(foodId);
                    if (!foundFood) {
                        // out of food, need to bank
                        state = 'banking';
                        this.addChat(0, 'Entering banking state', '');
                        continue;
                    }
                    await sleep(1000);
                    continue; // Restart the outer while loop.
                }
                await sleep(1400); // wait for NPC death animation.
                // Try to pick up any items on the ground.
                let items = this.filterGroundItemsIds(pickupItems);
                while (items.length > 0) {
                    const item = items.shift();
                    if (item != null) {
                        await this.pickupNearestIdValidated(item);
                        if (this.countInvById(bonesId) > 0) {
                            await this.buryBones([bonesId]);
                            await sleep(700);
                        }
                    }
                    if (this.invFull()) {
                        break;
                    }
                    items = this.filterGroundItemsIds(pickupItems);
                }
                if (this.invFull()) {
                    // Handle full inventory, maybe bank.
                    this.equipItemInv(rangeAmmoId);
                    await sleep(700);
                    if (this.countInvById(bonesId) > 0) {
                        await this.buryBones([bonesId]);
                        continue;
                    } else {
                        // No bones, so inv full of other stuff, need to bank.
                        state = 'banking';
                        this.addChat(0, 'Entering banking state', '');
                        continue;
                    }
                }
                console.log('About to attack npc in bounds');
                await this.attackNearestNPCInBounds(needle, attackNPCBounds[0], attackNPCBounds[1], attackNPCBounds[2], attackNPCBounds[3], 20);
                // Wait until we're actually in combat.
                let iter = 0;
                while (!this.anyNPCafterMe() && iter < 20) {
                    iter++;
                    await sleep(300);
                }
                // Run to safe spot
                await this.walkToEndofPath([safeSpot]);
                await sleep(700);
            } else {
                if (!this.playerIsInBounds(safeSpotBounds)) {
                    await this.walkToEndofPath([safeSpot]);
                    await sleep(700);
                }
                await this.attackNearestNPCAfterMe(needle);
            }
            await sleep(1200);
        }
    }

    async onF1Pressed_smithIronKnivesVarrock() {
        this.stopLoop = false;
        this.reportXPOnInterval(PlayerStat.SMITHING, 60_000, 'Smithing');
        let state = 'banking';
        let bankSpot = [3185, 3436];
        let anvilSpot = [3188, 3427];
        let hammerId = 2347;
        let ironBarId = 2351;
        let anvilId = 2783;

        while (!this.stopLoop) {
            if (state == 'banking') {
                await this.walkToEndofPath([bankSpot]);
                await sleep(2000);
                console.log('Just got back to the bank. Checking logout login');
                await this.logoutThenLoginThrottled(60); // do it every hour
                await sleep(700);
                await this.depositAllExceptNoMouse([hammerId]);
                await sleep(600);
                if (this.checkBankOpen()) {
                    // withdraw immediately
                    await this.withdrawAllNoMouse(ironBarId);
                }
                await sleep(1200);
                if (this.invCount() < 28) {
                    console.log('Do not have full inv of bars. Logging out.');
                    this.stopLoop = true;
                    await this.logout();
                }
                await this.walkToEndofPath([anvilSpot]);
                await sleep(1200);
                state = 'not banking';
                this.addChat(0, 'Finished banking state', '');
            }
            await this.handleRunEnergyThrottled(1);
            for (let _ = 0; _ < 2; _++) {
                this.selectAndUseOnNearest(ironBarId, anvilId);
                await sleep(700);
                // Make 10 Iron Knives; Using menu item 2 with action=555, a=863, b=2, c=1123
                this.useInvButton3(863, 2, 1123);
                await sleep(32000);
            }
            this.selectAndUseOnNearest(ironBarId, anvilId);
            await sleep(700);
            this.useInvButton3(863, 2, 1123);
            await sleep(25000);
            state = 'banking';
            await sleep(1200);
        }
    }
}
