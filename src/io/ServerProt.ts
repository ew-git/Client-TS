export const enum ServerProt {
    // interfaces
    IF_OPENCHAT = 189,
    IF_OPENMAIN_SIDE = 207,
    IF_CLOSE = 214,
    IF_SETTAB = 200,
    IF_OPENMAIN = 10,
    IF_OPENSIDE = 176,
    IF_SETTAB_ACTIVE = 56,

    // updating interfaces
    IF_SETCOLOUR = 78,
    IF_SETHIDE = 123,
    IF_SETOBJECT = 164,
    IF_SETMODEL = 245,
    IF_SETANIM = 219,
    IF_SETPLAYERHEAD = 108,
    IF_SETTEXT = 154,
    IF_SETNPCHEAD = 129,
    IF_SETPOSITION = 241,

    // tutorial area
    TUT_FLASH = 168,
    TUT_OPEN = 174,

    // inventory
    UPDATE_INV_STOP_TRANSMIT = 162,
    UPDATE_INV_FULL = 72,
    UPDATE_INV_PARTIAL = 132,

    // camera control
    CAM_LOOKAT = 222,
    CAM_SHAKE = 50,
    CAM_MOVETO = 12,
    CAM_RESET = 53,

    // entity updates
    NPC_INFO = 244,
    PLAYER_INFO = 86,

    // input tracking
    FINISH_TRACKING = 60,
    ENABLE_TRACKING = 22,

    // social
    MESSAGE_GAME = 95,
    UPDATE_IGNORELIST = 7,
    CHAT_FILTER_SETTINGS = 9,
    MESSAGE_PRIVATE = 30,
    UPDATE_FRIENDLIST = 70,

    // misc
    UNSET_MAP_FLAG = 62,
    UPDATE_RUNWEIGHT = 160,
    HINT_ARROW = 49,
    UPDATE_REBOOT_TIMER = 85,
    UPDATE_STAT = 24,
    UPDATE_RUNENERGY = 177,
    RESET_ANIMS = 242,
    UPDATE_PID = 210,
    LAST_LOGIN_INFO = 44,
    LOGOUT = 17,
    P_COUNTDIALOG = 152,
    SET_MULTIWAY = 97,

    // maps
    REBUILD_NORMAL = 165,

    // vars
    VARP_SMALL = 236,
    VARP_LARGE = 226,
    RESET_CLIENT_VARCACHE = 87,

    // audio
    SYNTH_SOUND = 151,
    MIDI_SONG = 240,
    MIDI_JINGLE = 173,

    // zones
    UPDATE_ZONE_PARTIAL_FOLLOWS = 94,
    UPDATE_ZONE_FULL_FOLLOWS = 131,
    UPDATE_ZONE_PARTIAL_ENCLOSED = 233,

    // zone protocol
    LOC_MERGE = 29,
    LOC_ANIM = 155,
    OBJ_DEL = 39,
    OBJ_REVEAL = 69,
    LOC_ADD_CHANGE = 232,
    MAP_PROJANIM = 137,
    LOC_DEL = 125,
    OBJ_COUNT = 209,
    MAP_ANIM = 198,
    OBJ_ADD = 234
};

// prettier-ignore
export const ServerProtSizes = [
    0, 0, 0, 0, 0, 0, 0, -2, 0, 3, 2, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0,
    0, 0, 0, 14, -1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 10, 0, 0, 0, 0, 6, 4, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 9, 0, -2, 0, 0, 0, 0, 0, 4,
    0, 0, 0, 0, 0, 0, 2, -2, 0, 0, 0, 0, 0, 0, 0, 2, -1, 0, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 2, 0,
    0, 0, 4, 0, 2, -2, 0, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0,
    0, -2, 4, 0, 0, 2, 0, 2, 0, 2, 0, 6, 4, 0, 0, 1, 0, 0, 0, 0, 4, 2, 0, 2, 1, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0,
    3, 0, 0, 0, 0, 0, 0, 4, 0, 7, 3, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 6, 0, 0, 0, 6,
    0, 0, 0, 0, 0, 4, -2, 5, 0, 3, 0, 0, 0, 2, 6, 0, 0, -2, 4, 0, 0, 0, 0, 0, 0, 0,
    0, 0
];
