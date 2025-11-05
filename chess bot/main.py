import os
import asyncio
import sqlite3
import json
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from dotenv import load_dotenv

# 🔹 Bot token
load_dotenv()
TOKEN = os.getenv("BOT_TOKEN")
if not TOKEN:
    raise ValueError("❌ BOT_TOKEN topilmadi!")

bot = Bot(token=TOKEN)
dp = Dispatcher()

CHANNEL = "@ruzibekov24_designs"

# ==========================
# 🗃️ BAZA
# ==========================
def create_db():
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            username TEXT,
            bonus INTEGER DEFAULT 0,
            last_bonus_date TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS shop_items (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            cost INTEGER,
            description TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_items (
            user_id INTEGER,
            item_id INTEGER,
            PRIMARY KEY (user_id, item_id)
        )
    """)

    # 10 ta item
    shop_items = [
        (1, "♟️ Emoji Pack 1", 30, "Shaxmat harakatida emoji ishlatish"),
        (2, "♟️ Emoji Pack 2", 30, "Shaxmat harakatida emoji ishlatish"),
        (3, "⚡ Tezkor Mini O‘yin", 50, "Bonus orqali tezkor mini o‘yin ochish"),
        (4, "🪙 Extra Bonus 50", 50, "Qo‘shimcha bonus ball olish"),
        (5, "🪙 Extra Bonus 100", 100, "Qo‘shimcha bonus ball olish"),
        (6, "🏆 Maxsus Rank", 70, "Profilga maxsus rank qo‘shish"),
        (7, "🎯 Mini Game Unlock 1", 40, "Yangi mini o‘yin turini ochish"),
        (8, "🎯 Mini Game Unlock 2", 40, "Yangi mini o‘yin turini ochish"),
        (9, "🎁 Surprise Box", 80, "Random bonus yoki item ochish"),
        (10, "🔔 Notification Pack", 60, "Maxsus xabar yoki bildirishnomalar olish")
    ]
    for item in shop_items:
        cur.execute("INSERT OR IGNORE INTO shop_items (item_id, name, cost, description) VALUES (?, ?, ?, ?)", item)

    conn.commit()
    conn.close()

def add_user(user_id: int, username: str):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT user_id FROM users WHERE user_id=?", (user_id,))
    if not cur.fetchone():
        cur.execute("INSERT INTO users (user_id, username, bonus, last_bonus_date) VALUES (?, ?, 0, NULL)", (user_id, username))
        conn.commit()
    conn.close()

def give_bonus(user_id: int, amount: int = 10):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET bonus = bonus + ? WHERE user_id=?", (amount, user_id))
    conn.commit()
    conn.close()

def get_user_bonus(user_id: int):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT bonus FROM users WHERE user_id=?", (user_id,))
    res = cur.fetchone()
    conn.close()
    return res[0] if res else 0

def today_date():
    return datetime.now().strftime("%Y-%m-%d")

def can_get_daily_bonus(user_id: int):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT last_bonus_date FROM users WHERE user_id=?", (user_id,))
    res = cur.fetchone()
    conn.close()
    return not res or res[0] != today_date()

def update_last_bonus_date(user_id: int):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_bonus_date=? WHERE user_id=?", (today_date(), user_id))
    conn.commit()
    conn.close()

def get_shop_items():
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT item_id, name, cost, description FROM shop_items")
    items = cur.fetchall()
    conn.close()
    return items

def buy_item(user_id: int, item_id: int):
    conn = sqlite3.connect("users.db")
    cur = conn.cursor()
    cur.execute("SELECT cost FROM shop_items WHERE item_id=?", (item_id,))
    res = cur.fetchone()
    if not res:
        conn.close()
        return "❌ Item topilmadi!"
    cost = res[0]
    bonus = get_user_bonus(user_id)
    if bonus < cost:
        conn.close()
        return f"❌ Bonus yetarli emas! Sizda {bonus}, kerak {cost}."
    give_bonus(user_id, -cost)
    cur.execute("INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)", (user_id, item_id))
    conn.commit()
    conn.close()
    return "✅ Item muvaffaqiyatli sotib olindi!"

# ==========================
# 🔹 MENULAR
# ==========================
def main_menu():
    markup = ReplyKeyboardMarkup(resize_keyboard=True, keyboard=[
        [KeyboardButton(text="Shaxmat o‘ynash"), KeyboardButton(text="Shashka o‘ynash")],
        [KeyboardButton(text="💰 Bonusni ko‘rish"), KeyboardButton(text="🎁 Bonus olish")],
        [KeyboardButton(text="💎 Shop")]
    ])
    return markup

def ask_to_subscribe():
    return ReplyKeyboardMarkup(resize_keyboard=True, keyboard=[
        [KeyboardButton(text="🔗 Kanalga obuna bo‘lish")],
        [KeyboardButton(text="✅ Tekshirish")]
    ])

# ==========================
# 🔹 INLINE WEB APP BUTTON
# ==========================
web_app_button = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(
        text="♟️ Mini Shaxmat o‘ynash",
        web_app={"url":"https://ruzibekov24.github.io/chess-bot/"}
    )]
])

# ==========================
# 🔹 HANDLERLAR
# ==========================
@dp.message(CommandStart())
async def start_handler(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username or "Noma’lum"
    add_user(user_id, username)

    if not await is_subscribed(user_id):
        await message.answer("📢 Botdan foydalanish uchun kanalga obuna bo‘ling:", reply_markup=ask_to_subscribe())
        return

    await message.answer("Salom! 👋\nQaysi o‘yin turini tanlaysiz?", reply_markup=main_menu())

# Obuna tekshirish
async def is_subscribed(user_id: int):
    try:
        member = await bot.get_chat_member(CHANNEL, user_id)
        return member.status not in ["left", "kicked"]
    except:
        return False

# ==========================
# /buy handler
# ==========================
@dp.message(F.text.startswith("/buy"))
async def buy_handler(message: types.Message):
    parts = message.text.split()
    if len(parts) != 2 or not parts[1].isdigit():
        await message.answer("❗ Format: /buy item_id (masalan: /buy 1)")
        return
    item_id = int(parts[1])
    result = buy_item(message.from_user.id, item_id)
    await message.answer(result)

# ==========================
# F.text handler
# ==========================
@dp.message(F.text)
async def handle_text(message: types.Message):
    user_id = message.from_user.id
    username = message.from_user.username or "Noma’lum"
    add_user(user_id, username)

    if not await is_subscribed(user_id):
        await message.answer("📢 Avval kanalga obuna bo‘ling:", reply_markup=ask_to_subscribe())
        return

    text = message.text

    if text == "Shaxmat o‘ynash":
        await message.answer(
            "♟️ Mini Shaxmatni ochish uchun tugmani bosing:",
            reply_markup=web_app_button
        )

    elif text == "Shashka o‘ynash":
        await message.answer("🎯 Shashka hali tayyor emas 😅")

    elif text == "💰 Bonusni ko‘rish":
        bonus = get_user_bonus(user_id)
        await message.answer(f"💰 Sizning bonuslaringiz: {bonus} ball.")

    elif text == "🎁 Bonus olish":
        if can_get_daily_bonus(user_id):
            give_bonus(user_id, 10)
            update_last_bonus_date(user_id)
            await message.answer("✅ Bugungi bonus olindi! +10 💰\nErtaga 00:00 dan keyin yana kiring 🎉")
        else:
            await message.answer("🕛 Siz bugungi bonusni allaqachon olgansiz!\n00:00 dan keyin yana urinib ko‘ring 🌙")

    elif text == "💎 Shop":
        items = get_shop_items()  # endi 10 ta item
        text_shop = "🛒 Shop Items:\n\n"
        for item in items:
            text_shop += f"{item[0]}. {item[1]} - {item[2]} 💰\n{item[3]}\n\n"
        text_shop += "Item sotib olish uchun /buy item_id formatida yozing (masalan: /buy 1)"
        await message.answer(text_shop)

    elif text == "🔗 Kanalga obuna bo‘lish":
        await message.answer(f"📢 Kanalga obuna bo‘lish: https://t.me/{CHANNEL[1:]}")

    elif text == "✅ Tekshirish":
        if await is_subscribed(user_id):
            await message.answer("✅ Siz obuna bo‘ldingiz!")
        else:
            await message.answer("❌ Hali obuna bo‘lmadingiz!")

    else:
        await message.answer("❗ Noma’lum buyruq. Iltimos, pastki tugmalardan tanlang.")

# ==========================
# 🔹 MAIN
# ==========================
async def main():
    create_db()
    print("♟️ Bot ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
