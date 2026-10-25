# ORGET Shop সেটআপ (ফোন থেকে)

## ধাপ ১: ফাইল আপলোড
1. GitHub-এ `orgetshop/orgetshop.github.io` রিপোজিটরি খুলুন।
2. **Add file → Upload files** চাপুন।
3. এই ৯টি ফাইল একসাথে বেছে নিন: `index.html`, `admin.html`, `shop.js`, `shop.css`, `logo.svg`, `products.json`, `site.json`, `robots.txt`, `sitemap.xml`
4. নিচে **Commit changes** চাপুন।

## ধাপ ২: সাইট চালু
1. রিপোজিটরির **Settings → Pages** খুলুন।
2. Source: **Deploy from a branch**, Branch: **main**, Folder: **/(root)** → **Save**।
3. ১-২ মিনিট পর `https://orgetshop.github.io` খুলুন।

## ধাপ ৩: অ্যাডমিনের চাবি (টোকেন) বানানো
1. GitHub → আপনার ছবি → **Settings** → একদম নিচে **Developer settings**।
2. **Personal access tokens → Fine-grained tokens → Generate new token**।
3. নাম: `orget-shop`, Expiration: ১ বছর।
4. **Repository access → Only select repositories** → `orgetshop.github.io`।
5. **Permissions → Repository permissions → Contents → Read and write**।
6. **Generate token** চেপে টোকেন কপি করুন। এটা কাউকে দেবেন না।

## ধাপ ৪: পণ্য যোগ
1. `https://orgetshop.github.io/admin.html` খুলুন, টোকেন পেস্ট করে **ঢুকুন**।
2. **সেটিংস** ট্যাবে ORGET অ্যাপের লগইন লিংক বসান।
3. **+ নতুন পণ্য** থেকে পণ্য দিন (ছবি, কালার, RAM/ROM ভেরিয়েন্টসহ)।
4. সেভের পর সাইটে আসতে ১-২ মিনিট লাগে।

## ভেরিয়েন্টের নমুনা
```
4GB/64GB = 11500
4GB/128GB = 12900
```

## গুগল সার্চ
- প্রতিটি পণ্যের আলাদা পেজ তৈরি হয়, টাইটেল হয় "Redmi A5 Price in Bangladesh | অরগেট এন্টারপ্রাইজ"।
- গুগলকে জানাতে: Google Search Console-এ `https://orgetshop.github.io/` যোগ করে `sitemap.xml` জমা দিন।
- র‍্যাংকিং হতে কয়েক সপ্তাহ লাগতে পারে, প্রথম পাতায় আসার নিশ্চয়তা কেউ দিতে পারে না।
