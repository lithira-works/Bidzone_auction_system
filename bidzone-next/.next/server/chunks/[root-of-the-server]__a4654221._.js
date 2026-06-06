module.exports = [
"[project]/.next-internal/server/app/api/auctions/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/mongoose [external] (mongoose, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("mongoose", () => require("mongoose"));

module.exports = mod;
}),
"[project]/src/lib/mongodb.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "connectToDatabase",
    ()=>connectToDatabase,
    "default",
    ()=>__TURBOPACK__default__export__,
    "isDbConnectionError",
    ()=>isDbConnectionError
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}
const cached = global._mongooseCache ?? {
    conn: null,
    promise: null
};
global._mongooseCache = cached;
async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn;
    }
    if (!cached.promise) {
        cached.promise = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 8_000,
            connectTimeoutMS: 8_000
        }).then((m)=>m);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}
function isDbConnectionError(err) {
    return err instanceof Error && (err.name === 'MongooseServerSelectionError' || err.name === 'MongoServerSelectionError');
}
const __TURBOPACK__default__export__ = connectToDatabase;
}),
"[project]/src/models/Auction.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuctionModel",
    ()=>AuctionModel
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const AuctionSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    title: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    images: {
        type: [
            String
        ],
        default: undefined
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    currentBid: {
        type: Number,
        required: true,
        min: 0
    },
    buyNow: {
        type: Number
    },
    reservePrice: {
        type: Number
    },
    bids: {
        type: Number,
        default: 0
    },
    timeLeft: {
        type: String,
        default: ''
    },
    urgent: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    },
    sellerName: {
        type: String,
        trim: true
    },
    sellerId: {
        type: String,
        index: true
    },
    listingDescription: {
        type: String
    },
    condition: {
        type: String
    },
    auctionEndsAt: {
        type: Date
    },
    auctionCreatedAt: {
        type: Date,
        default: Date.now
    },
    moderationStatus: {
        type: String,
        enum: [
            'pending',
            'approved',
            'rejected'
        ],
        default: 'pending',
        index: true
    },
    listingSource: {
        type: String,
        enum: [
            'admin',
            'seller'
        ],
        default: 'seller'
    }
}, {
    timestamps: true
});
AuctionSchema.index({
    category: 1
});
AuctionSchema.index({
    auctionEndsAt: 1
});
AuctionSchema.index({
    moderationStatus: 1,
    auctionCreatedAt: -1
});
const AuctionModel = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Auction ?? __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('Auction', AuctionSchema);
}),
"[project]/src/models/User.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UserModel",
    ()=>UserModel
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const UserSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    role: {
        type: String,
        enum: [
            'bidder',
            'seller',
            'admin'
        ],
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: '',
        trim: true
    },
    city: {
        type: String,
        default: '',
        trim: true
    },
    phone: {
        type: String,
        default: '',
        trim: true
    },
    phoneVerified: {
        type: Boolean,
        default: false
    },
    kycStatus: {
        type: String,
        enum: [
            'not_required',
            'pending',
            'verified',
            'rejected'
        ],
        default: 'not_required'
    },
    listingAllowed: {
        type: Boolean,
        default: false
    },
    fraudCheckPassed: {
        type: Boolean,
        default: false
    },
    avatarUrl: {
        type: String,
        default: null
    },
    isSuperAdmin: {
        type: Boolean,
        default: false
    },
    delegatedAdmin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
const UserModel = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.User ?? __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('User', UserSchema);
}),
"[externals]/buffer [external] (buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("buffer", () => require("buffer"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/util [external] (util, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("util", () => require("util"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/src/lib/auth.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Server-side only — JWT sign/verify utilities.
 * Never import this file from client components.
 */ __turbopack_context__.s([
    "requireAuth",
    ()=>requireAuth,
    "signToken",
    ()=>signToken,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/jsonwebtoken/index.js [app-route] (ecmascript)");
;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('Please define JWT_SECRET in .env.local');
}
function signToken(payload) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].sign(payload, JWT_SECRET, {
        expiresIn: '30d'
    });
}
function verifyToken(token) {
    try {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$jsonwebtoken$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].verify(token, JWT_SECRET);
    } catch  {
        return null;
    }
}
function requireAuth(req) {
    const auth = req.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) return null;
    return verifyToken(auth.slice(7));
}
}),
"[project]/src/lib/admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Server-side admin authorization.
 * Super admins come from ADMIN_EMAILS env; delegated admins are promoted in the admin console.
 */ __turbopack_context__.s([
    "demoteAdminUser",
    ()=>demoteAdminUser,
    "getAdminAllowlist",
    ()=>getAdminAllowlist,
    "isActiveAdmin",
    ()=>isActiveAdmin,
    "isAdminEmail",
    ()=>isAdminEmail,
    "isProtectedAdmin",
    ()=>isProtectedAdmin,
    "promoteToDelegatedAdmin",
    ()=>promoteToDelegatedAdmin,
    "requireAdmin",
    ()=>requireAdmin,
    "syncAdminRole",
    ()=>syncAdminRole,
    "toAdminUserSummary",
    ()=>toAdminUserSummary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
;
;
;
function getAdminAllowlist() {
    return new Set((process.env.ADMIN_EMAILS ?? '').split(',').map((email)=>email.trim().toLowerCase()).filter(Boolean));
}
function isAdminEmail(email) {
    return getAdminAllowlist().has(email.toLowerCase().trim());
}
function isProtectedAdmin(user) {
    return user.isSuperAdmin || isAdminEmail(user.email);
}
function fallbackRoleForUser(user) {
    return user.listingAllowed && user.phoneVerified && user.kycStatus === 'verified' ? 'seller' : 'bidder';
}
async function syncAdminRole(user) {
    const envAdmin = isAdminEmail(user.email);
    let changed = false;
    if (envAdmin) {
        if (user.role !== 'admin' || !user.isSuperAdmin) {
            user.role = 'admin';
            user.isSuperAdmin = true;
            user.delegatedAdmin = false;
            changed = true;
        }
    } else if (user.isSuperAdmin) {
        user.isSuperAdmin = false;
        if (!user.delegatedAdmin) {
            user.role = fallbackRoleForUser(user);
        }
        changed = true;
    }
    if (changed) await user.save();
    return user;
}
function isActiveAdmin(user) {
    return user.role === 'admin' && (user.isSuperAdmin || user.delegatedAdmin || isAdminEmail(user.email));
}
async function requireAdmin(req) {
    const claims = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAuth"])(req);
    if (!claims) return null;
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
    const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].findById(claims.userId).select('email role isSuperAdmin delegatedAdmin');
    if (!user || !isActiveAdmin(user)) return null;
    return {
        userId: user._id.toString(),
        email: user.email,
        role: 'admin',
        isSuperAdmin: user.isSuperAdmin || isAdminEmail(user.email)
    };
}
function toAdminUserSummary(user) {
    return {
        id: user._id.toString(),
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        kycStatus: user.kycStatus,
        listingAllowed: user.listingAllowed,
        fraudCheckPassed: user.fraudCheckPassed,
        city: user.city,
        isSuperAdmin: user.isSuperAdmin || isAdminEmail(user.email),
        delegatedAdmin: user.delegatedAdmin,
        adminType: user.isSuperAdmin || isAdminEmail(user.email) ? 'super' : user.delegatedAdmin ? 'delegated' : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
    };
}
async function demoteAdminUser(user) {
    user.role = fallbackRoleForUser(user);
    user.delegatedAdmin = false;
    user.isSuperAdmin = false;
    await user.save();
    return user;
}
async function promoteToDelegatedAdmin(user) {
    user.role = 'admin';
    user.delegatedAdmin = true;
    await user.save();
    return user;
}
}),
"[project]/src/lib/auctionTime.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Helpers for seller-set auction end times (ISO 8601). */ __turbopack_context__.s([
    "displayAuctionEndLocal",
    ()=>displayAuctionEndLocal,
    "formatTimeLeftCompact",
    ()=>formatTimeLeftCompact,
    "fromDatetimeLocalValue",
    ()=>fromDatetimeLocalValue,
    "secondsToHmsParts",
    ()=>secondsToHmsParts,
    "secondsUntil",
    ()=>secondsUntil,
    "toDatetimeLocalValue",
    ()=>toDatetimeLocalValue
]);
function secondsUntil(isoEnd, now = new Date()) {
    const endMs = new Date(isoEnd).getTime();
    if (!Number.isFinite(endMs)) return 0;
    return Math.max(0, Math.floor((endMs - now.getTime()) / 1000));
}
function secondsToHmsParts(total) {
    const t = Math.max(0, Math.floor(total));
    return {
        h: Math.floor(t / 3600),
        m: Math.floor(t % 3600 / 60),
        s: t % 60
    };
}
function formatTimeLeftCompact(isoEnd, now = new Date()) {
    const sec = secondsUntil(isoEnd, now);
    if (sec <= 0) return '—';
    const d = Math.floor(sec / 86400);
    const h = Math.floor(sec % 86400 / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
function toDatetimeLocalValue(d) {
    const pad = (n)=>String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromDatetimeLocalValue(localValue) {
    const d = new Date(localValue);
    return d.toISOString();
}
function displayAuctionEndLocal(isoEnd) {
    try {
        return new Date(isoEnd).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch  {
        return isoEnd;
    }
}
}),
"[project]/src/lib/auctionMapper.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toAdminAuctionSummary",
    ()=>toAdminAuctionSummary,
    "toAuctionItem",
    ()=>toAuctionItem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionTime$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auctionTime.ts [app-route] (ecmascript)");
;
function toAuctionItem(doc) {
    const endsIso = doc.auctionEndsAt?.toISOString();
    return {
        id: doc._id.toString(),
        title: doc.title,
        image: doc.image,
        images: doc.images?.length ? doc.images : undefined,
        category: doc.category,
        currentBid: doc.currentBid,
        buyNow: doc.buyNow,
        reservePrice: doc.reservePrice,
        bids: doc.bids,
        timeLeft: endsIso ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionTime$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatTimeLeftCompact"])(endsIso) : doc.timeLeft,
        urgent: doc.urgent,
        featured: doc.featured,
        sellerName: doc.sellerName,
        listingDescription: doc.listingDescription,
        condition: doc.condition,
        auctionEndsAt: endsIso,
        auctionCreatedAt: doc.auctionCreatedAt?.toISOString(),
        moderationStatus: doc.moderationStatus,
        listingSource: doc.listingSource
    };
}
function toAdminAuctionSummary(doc) {
    const item = toAuctionItem(doc);
    return {
        ...item,
        sellerId: doc.sellerId
    };
}
}),
"[project]/src/app/api/auctions/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Auction.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auth.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/admin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionMapper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auctionMapper.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionTime$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/auctionTime.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
function parseImages(body) {
    const raw = body.images?.filter((u)=>typeof u === 'string' && u.trim()) ?? [];
    if (raw.length > 0) return raw.slice(0, 8);
    if (body.image) return [
        body.image
    ];
    return undefined;
}
function parseCreateBody(body) {
    if (!body.title?.trim() || !body.image || !body.category || body.currentBid == null) {
        return null;
    }
    const images = parseImages(body);
    return {
        title: body.title.trim(),
        image: body.image,
        images,
        category: body.category,
        currentBid: body.currentBid,
        buyNow: body.buyNow,
        reservePrice: body.reservePrice,
        bids: body.bids ?? 0,
        urgent: body.urgent ?? false,
        featured: body.featured ?? false,
        sellerName: body.sellerName?.trim(),
        listingDescription: body.listingDescription,
        condition: body.condition,
        auctionEndsAt: body.auctionEndsAt ? new Date(body.auctionEndsAt) : undefined,
        timeLeft: body.auctionEndsAt ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionTime$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatTimeLeftCompact"])(body.auctionEndsAt) : ''
    };
}
async function GET() {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        const auctions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].find({
            moderationStatus: 'approved'
        }).sort({
            auctionCreatedAt: -1
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            auctions: auctions.map(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionMapper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toAuctionItem"])
        });
    } catch (err) {
        console.error('[/api/auctions GET]', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(req) {
    try {
        const claims = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auth$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAuth"])(req);
        if (!claims) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Unauthorized'
            }, {
                status: 401
            });
        }
        const body = await req.json();
        const parsed = parseCreateBody(body);
        if (!parsed) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields'
            }, {
                status: 400
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].findById(claims.userId);
        if (!user) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'User not found'
            }, {
                status: 404
            });
        }
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isActiveAdmin"])(user)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Admins should create listings from the admin console'
            }, {
                status: 403
            });
        }
        if (user.role !== 'seller' || !user.listingAllowed || !user.phoneVerified) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Seller listing not permitted'
            }, {
                status: 403
            });
        }
        const auction = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].create({
            ...parsed,
            sellerId: claims.userId,
            sellerName: parsed.sellerName || user.fullName,
            auctionCreatedAt: new Date(),
            moderationStatus: 'pending',
            listingSource: 'seller'
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            auction: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$auctionMapper$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toAuctionItem"])(auction),
            pendingApproval: true
        }, {
            status: 201
        });
    } catch (err) {
        console.error('[/api/auctions POST]', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a4654221._.js.map