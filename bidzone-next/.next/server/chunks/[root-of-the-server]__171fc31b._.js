module.exports = [
"[project]/.next-internal/server/app/api/admin/stats/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/src/models/Bid.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BidModel",
    ()=>BidModel
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/mongoose [external] (mongoose, cjs)");
;
const BidSchema = new __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["Schema"]({
    auctionId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    placedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});
BidSchema.index({
    auctionId: 1,
    placedAt: -1
});
BidSchema.index({
    userId: 1,
    placedAt: -1
});
const BidModel = __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].models.Bid ?? __TURBOPACK__imported__module__$5b$externals$5d2f$mongoose__$5b$external$5d$__$28$mongoose$2c$__cjs$29$__["default"].model('Bid', BidSchema);
}),
"[project]/src/app/api/admin/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/mongodb.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/admin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/User.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Auction.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Bid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/models/Bid.ts [app-route] (ecmascript)");
;
;
;
;
;
;
async function GET(req) {
    try {
        const admin = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["requireAdmin"])(req);
        if (!admin) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Forbidden'
            }, {
                status: 403
            });
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$mongodb$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["connectToDatabase"])();
        const now = new Date();
        const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const [totalUsers, bidders, sellers, admins, pendingKyc, rejectedKyc, pendingListings, totalAuctions, activeAuctions, totalBids, bidsToday, newUsersWeek] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                role: 'bidder'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                role: 'seller'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                role: 'admin'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                kycStatus: 'pending'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                kycStatus: 'rejected'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].countDocuments({
                moderationStatus: 'pending'
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].countDocuments(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].countDocuments({
                moderationStatus: 'approved',
                auctionEndsAt: {
                    $gt: now
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Bid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BidModel"].countDocuments(),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Bid$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BidModel"].countDocuments({
                placedAt: {
                    $gte: dayAgo
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].countDocuments({
                createdAt: {
                    $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                }
            })
        ]);
        const recentUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$User$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UserModel"].find().sort({
            createdAt: -1
        }).limit(5).select('fullName email role kycStatus createdAt').lean();
        const recentAuctions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$models$2f$Auction$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AuctionModel"].find({
            moderationStatus: 'approved'
        }).sort({
            auctionCreatedAt: -1
        }).limit(5).select('title currentBid bids sellerName auctionCreatedAt featured').lean();
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            stats: {
                totalUsers,
                bidders,
                sellers,
                admins,
                pendingKyc,
                rejectedKyc,
                pendingListings,
                totalAuctions,
                activeAuctions,
                totalBids,
                bidsToday,
                newUsersWeek
            },
            recentUsers: recentUsers.map((u)=>({
                    id: u._id.toString(),
                    fullName: u.fullName,
                    email: u.email,
                    role: u.role,
                    kycStatus: u.kycStatus,
                    createdAt: u.createdAt.toISOString()
                })),
            recentAuctions: recentAuctions.map((a)=>({
                    id: a._id.toString(),
                    title: a.title,
                    currentBid: a.currentBid,
                    bids: a.bids,
                    sellerName: a.sellerName,
                    featured: a.featured,
                    auctionCreatedAt: a.auctionCreatedAt?.toISOString()
                }))
        });
    } catch (err) {
        console.error('[/api/admin/stats GET]', err);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__171fc31b._.js.map