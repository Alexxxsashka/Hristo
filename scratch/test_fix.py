
def fix_encoding(text):
    try:
        # Try to fix "double-encoded" UTF-8
        # String (corrupted) -> encode to latin1 or cp1251 -> decode as utf-8
        # Most common is utf-8 bytes interpreted as cp1251 and saved again
        return text.encode('cp1251').decode('utf-8')
    except:
        return text

sample = "РњР†РќР†РЎРўР•Р РЎРўР’Рћ"
fixed = fix_encoding(sample)
print(f"Sample: {sample}")
print(f"Fixed: {fixed}")

# Let's check another one: РћРЎР’Р†РўР˜
sample2 = "РћРЎР’Р†РўР˜"
print(f"Sample2: {sample2}")
print(f"Fixed2: {fix_encoding(sample2)}")
