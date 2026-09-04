import type { Category, Store, StoreKind } from "@/lib/types";

const ALL: Category[] = [
  "games",
  "groceries",
  "clothes",
  "electronics",
  "pharmacy",
  "home",
  "books",
  "collectibles",
  "cars",
  "beauty",
];
const GOODS = ALL.filter((c) => c !== "cars" && c !== "collectibles" && c !== "games");
const LOCAL: Category[] = ALL.filter((c) => c !== "games");
const CLOTHES: Category[] = ["clothes"];
const FOOD: Category[] = ["groceries"];
const BEAUTY: Category[] = ["beauty", "pharmacy"];
const MALL: Category[] = ["clothes", "beauty", "electronics", "home", "books"];
const HOME: Category[] = ["home"];
const TECH: Category[] = ["electronics"];
const GAMES: Category[] = ["games"];
const CARS: Category[] = ["cars"];
const BOOKS: Category[] = ["books"];
const COLLECT: Category[] = ["collectibles"];

function S(
  id: string,
  name: string,
  kind: StoreKind,
  sells: Category[],
  opts: { paypal?: boolean; pickup?: boolean; miles?: number; href?: string; bias?: number } = {},
): Store {
  const marketplace = kind === "marketplace" || kind === "handmade" || kind === "shop" || kind === "digital";
  return {
    id,
    name,
    kind,
    sells,
    paypal: opts.paypal ?? marketplace,
    pickup: opts.pickup ?? opts.miles != null,
    miles: opts.miles,
    href: opts.href,
    bias: opts.bias,
  };
}

export const STORES: Store[] = [
  S("walmart", "Walmart", "bigbox", GOODS, { pickup: true, miles: 3.6, href: "https://www.walmart.com/search?q=%s", bias: 0.97 }),
  S("target", "Target", "bigbox", GOODS, { pickup: true, miles: 2.1, href: "https://www.target.com/s?searchTerm=%s", bias: 1.02 }),
  S("amazon", "Amazon", "bigbox", GOODS, { href: "https://www.amazon.com/s?k=%s", bias: 1 }),
  S("bestbuy", "Best Buy", "bigbox", [...TECH, "games", "home"], { pickup: true, miles: 5.4, href: "https://www.bestbuy.com/site/searchpage.jsp?st=%s", bias: 1.06 }),
  S("offerup", "OfferUp", "marketplace", [...LOCAL, "games"], { paypal: true, pickup: true, miles: 1.8, href: "https://offerup.com/search?q=%s", bias: 0.62 }),
  S("mercari", "Mercari", "marketplace", [...GOODS, "games"], { paypal: true, href: "https://www.mercari.com/search/?keyword=%s", bias: 0.78 }),
  S("woot", "Woot", "bigbox", GOODS, { href: "https://www.woot.com/search?term=%s", bias: 0.88 }),
  S("ebay", "eBay", "marketplace", ALL, { paypal: true, href: "https://www.ebay.com/sch/i.html?_nkw=%s", bias: 0.81 }),
  S("etsy", "Etsy", "handmade", ["clothes", "home", "beauty", "collectibles"], { paypal: true, href: "https://www.etsy.com/search?q=%s", bias: 1.18 }),
  S("sams", "Sam's Club", "club", GOODS, { pickup: true, miles: 6.1, href: "https://www.samsclub.com/s/%s", bias: 0.91 }),
  S("aliexpress", "AliExpress", "marketplace", GOODS, { paypal: true, href: "https://www.aliexpress.com/w/wholesale-%s.html", bias: 0.54 }),
  S("costco", "Costco", "club", GOODS, { pickup: true, miles: 4.2, href: "https://www.costco.com/CatalogSearch?keyword=%s", bias: 0.9 }),
  S("poshmark", "Poshmark", "marketplace", CLOTHES, { paypal: true, href: "https://poshmark.com/search?query=%s", bias: 0.72 }),
  S("gmg", "Green Man Gaming", "digital", GAMES, { paypal: true, href: "https://www.greenmangaming.com/search/%s/", bias: 0.76 }),
  S("steam", "Steam", "digital", GAMES, { paypal: false, href: "https://store.steampowered.com/search/?term=%s", bias: 1.35 }),
  S("vons", "Vons", "grocery", FOOD, { pickup: true, miles: 0.8, href: "https://www.vons.com/shop/search-results.html?q=%s", bias: 1.12 }),
  S("cvs", "CVS", "pharmacy", ["pharmacy", "beauty", "groceries"], { pickup: true, miles: 0.4, href: "https://www.cvs.com/search?searchTerm=%s", bias: 1.28 }),
  S("stater", "Stater Bros.", "grocery", FOOD, { pickup: true, miles: 1.4, href: "https://www.staterbros.com/search/?q=%s", bias: 1.08 }),
  S("lego", "LEGO", "bigbox", HOME, { href: "https://www.lego.com/en-us/search?q=%s", bias: 1.02 }),
  S("humble", "Humble Bundle", "digital", GAMES, { paypal: true, href: "https://www.humblebundle.com/store/search?search=%s", bias: 0.82 }),
  S("fanatical", "Fanatical", "digital", GAMES, { paypal: true, href: "https://www.fanatical.com/en/search?search=%s", bias: 0.79 }),
  S("newegg", "Newegg", "bigbox", TECH, { paypal: true, href: "https://www.newegg.com/p/pl?d=%s", bias: 1.04 }),
  S("walgreens", "Walgreens", "pharmacy", ["pharmacy", "beauty", "groceries"], { pickup: true, miles: 0.9, href: "https://www.walgreens.com/search/results.jsp?Ntt=%s", bias: 1.32 }),
  S("ralphs", "Ralphs", "grocery", FOOD, { pickup: true, miles: 1.9, href: "https://www.ralphs.com/search?query=%s", bias: 1.14 }),
  S("depop", "Depop", "marketplace", CLOTHES, { paypal: true, href: "https://www.depop.com/search/?q=%s", bias: 0.7 }),
  S("goodwill", "Goodwill", "thrift", ["clothes", "home", "electronics", "books"], { pickup: true, miles: 2.4, bias: 0.11 }),
  S("savers", "Savers", "thrift", ["clothes", "home", "books"], { pickup: true, miles: 5.8, bias: 0.13 }),
  S("realreal", "The RealReal", "luxury", ["clothes", "beauty", "collectibles"], { paypal: true, href: "https://www.therealreal.com/shop?keywords=%s", bias: 0.58 }),
  S("nordstrom", "Nordstrom", "luxury", ["clothes", "beauty"], { pickup: true, miles: 7.2, href: "https://www.nordstrom.com/sr?keyword=%s", bias: 1.08 }),
  S("nordrack", "Nordstrom Rack", "mall", ["clothes", "beauty"], { pickup: true, miles: 6.4, href: "https://www.nordstromrack.com/sr?keyword=%s", bias: 0.72 }),
  S("armani", "Armani", "luxury", CLOTHES, { href: "https://www.armani.com/search?q=%s", bias: 1 }),
  S("farfetch", "Farfetch", "luxury", CLOTHES, { paypal: true, href: "https://www.farfetch.com/shopping/search/items.aspx?q=%s", bias: 1.04 }),
  S("zara", "Zara", "mall", CLOTHES, { pickup: true, miles: 8.1, href: "https://www.zara.com/us/en/search?searchTerm=%s", bias: 0.86 }),
  S("grailed", "Grailed", "marketplace", CLOTHES, { paypal: true, href: "https://www.grailed.com/shop?query=%s", bias: 0.64 }),
  S("stockx", "StockX", "marketplace", ["clothes", "collectibles", "electronics"], { paypal: true, href: "https://stockx.com/search?s=%s", bias: 1.12 }),
  S("goat", "GOAT", "marketplace", CLOTHES, { paypal: true, href: "https://www.goat.com/search?query=%s", bias: 1.16 }),
  S("thriftbooks", "ThriftBooks", "marketplace", BOOKS, { paypal: true, href: "https://www.thriftbooks.com/browse/?b.search=%s", bias: 0.38 }),
  S("abebooks", "AbeBooks", "marketplace", BOOKS, { paypal: true, href: "https://www.abebooks.com/servlet/SearchResults?kn=%s", bias: 0.52 }),
  S("barnes", "Barnes & Noble", "mall", [...BOOKS, "games"], { pickup: true, miles: 4.8, href: "https://www.barnesandnoble.com/s/%s", bias: 1.05 }),
  S("tcgplayer", "TCGplayer", "marketplace", COLLECT, { paypal: true, href: "https://www.tcgplayer.com/search/all/product?q=%s", bias: 0.92 }),
  S("cardkingdom", "Card Kingdom", "marketplace", COLLECT, { paypal: true, href: "https://www.cardkingdom.com/catalog/view?filter[search]=%s", bias: 1.04 }),
  S("trollandtoad", "Troll and Toad", "marketplace", COLLECT, { paypal: true, href: "https://www.trollandtoad.com/category.php?searchText=%s&search=Search", bias: 0.98 }),
  S("coolstuff", "CoolStuffInc", "marketplace", COLLECT, { paypal: true, href: "https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&resultsPerPage=25&q=%s", bias: 1.02 }),
  S("discogs", "Discogs", "marketplace", COLLECT, { paypal: true, href: "https://www.discogs.com/search/?q=%s", bias: 0.84 }),
  S("heritage", "Heritage Auctions", "auction", COLLECT, { href: "https://www.ha.com/search/?Ntt=%s", bias: 1.22 }),
  S("carmax", "CarMax", "auto", CARS, { pickup: true, miles: 9.4, href: "https://www.carmax.com/cars/%s", bias: 1.04 }),
  S("autotrader", "Autotrader", "auto", CARS, { pickup: true, miles: 11, href: "https://www.autotrader.com/cars-for-sale/all-cars?searchText=%s", bias: 1.01 }),
  S("carscom", "Cars.com", "auto", CARS, { pickup: true, miles: 10.2, href: "https://www.cars.com/shopping/?q=%s", bias: 0.99 }),
  S("craigslist", "Craigslist", "marketplace", [...LOCAL, "games"], { paypal: true, pickup: true, miles: 3.2, href: "https://losangeles.craigslist.org/search/sss?query=%s", bias: 0.76 }),
  S("fbmarket", "Marketplace", "marketplace", [...LOCAL, "games"], { paypal: true, pickup: true, miles: 2.6, href: "https://www.facebook.com/marketplace/glendora/search/?query=%s", bias: 0.73 }),

  S("shop", "Shop", "shop", [...GOODS, "games"], { paypal: true, href: "https://shop.app/search/%s", bias: 0.94 }),
  S("tiktokshop", "TikTok Shop", "shop", GOODS, { paypal: true, href: "https://www.tiktok.com/shop/search?q=%s", bias: 0.68 }),
  S("shein", "SHEIN", "marketplace", CLOTHES, { paypal: true, href: "https://www.shein.com/pdsearch/%s", bias: 0.42 }),
  S("temu", "Temu", "marketplace", GOODS, { paypal: true, href: "https://www.temu.com/search_result.html?search_key=%s", bias: 0.36 }),
  S("whatnot", "Whatnot", "marketplace", [...COLLECT, "clothes"], { paypal: true, href: "https://www.whatnot.com/search?q=%s", bias: 0.8 }),

  S("sephora", "Sephora", "beauty", BEAUTY, { pickup: true, miles: 8.0, href: "https://www.sephora.com/search?keyword=%s", bias: 1.12 }),
  S("ulta", "Ulta Beauty", "beauty", BEAUTY, { pickup: true, miles: 6.8, href: "https://www.ulta.com/search?q=%s", bias: 1.04 }),
  S("mac", "MAC Cosmetics", "beauty", BEAUTY, { pickup: true, miles: 8.0, href: "https://www.maccosmetics.com/search?q=%s", bias: 1.1 }),
  S("sally", "Sally Beauty", "beauty", BEAUTY, { pickup: true, miles: 4.1, href: "https://www.sallybeauty.com/search?q=%s", bias: 0.92 }),
  S("dermstore", "Dermstore", "beauty", BEAUTY, { paypal: true, href: "https://www.dermstore.com/search?q=%s", bias: 1.06 }),
  S("glossier", "Glossier", "shop", BEAUTY, { paypal: true, href: "https://www.glossier.com/search?q=%s", bias: 1.08 }),
  S("fenty", "Fenty Beauty", "shop", BEAUTY, { paypal: true, href: "https://fentybeauty.com/search?q=%s", bias: 1.05 }),
  S("rarebeauty", "Rare Beauty", "shop", BEAUTY, { paypal: true, href: "https://www.rarebeauty.com/search?q=%s", bias: 1.07 }),
  S("colourpop", "ColourPop", "shop", BEAUTY, { paypal: true, href: "https://colourpop.com/search?q=%s", bias: 0.78 }),
  S("ordinary", "The Ordinary", "beauty", BEAUTY, { href: "https://theordinary.com/search?q=%s", bias: 0.84 }),
  S("kylie", "Kylie Cosmetics", "shop", BEAUTY, { paypal: true, href: "https://kyliecosmetics.com/search?q=%s", bias: 1.02 }),
  S("lush", "Lush", "mall", BEAUTY, { pickup: true, miles: 8.0, bias: 1.15 }),
  S("bodyshop", "The Body Shop", "mall", BEAUTY, { pickup: true, miles: 8.0, bias: 1.06 }),
  S("bbw", "Bath & Body Works", "mall", BEAUTY, { pickup: true, miles: 8.0, bias: 1.01 }),
  S("riteaid", "Rite Aid", "pharmacy", ["pharmacy", "beauty", "groceries"], { pickup: true, miles: 1.7, bias: 1.24 }),

  S("traderjoes", "Trader Joe's", "grocery", FOOD, { pickup: true, miles: 3.2, bias: 0.96 }),
  S("wholefoods", "Whole Foods", "grocery", FOOD, { pickup: true, miles: 5.1, bias: 1.22 }),
  S("aldi", "Aldi", "grocery", FOOD, { pickup: true, miles: 6.4, bias: 0.82 }),
  S("sprouts", "Sprouts", "grocery", FOOD, { pickup: true, miles: 4.6, bias: 1.16 }),
  S("groceryoutlet", "Grocery Outlet", "grocery", FOOD, { pickup: true, miles: 5.9, bias: 0.74 }),
  S("smartfinal", "Smart & Final", "grocery", FOOD, { pickup: true, miles: 3.8, bias: 0.93 }),
  S("food4less", "Food 4 Less", "grocery", FOOD, { pickup: true, miles: 4.4, bias: 0.88 }),
  S("elsuper", "El Super", "grocery", FOOD, { pickup: true, miles: 5.2, bias: 0.9 }),
  S("northgate", "Northgate", "grocery", FOOD, { pickup: true, miles: 7.1, bias: 0.95 }),
  S("hmart", "H Mart", "grocery", FOOD, { pickup: true, miles: 11.4, bias: 1.08 }),
  S("ranch99", "99 Ranch", "grocery", FOOD, { pickup: true, miles: 10.8, bias: 1.04 }),
  S("albertsons", "Albertsons", "grocery", FOOD, { pickup: true, miles: 2.7, bias: 1.1 }),
  S("gelsons", "Gelson's", "grocery", FOOD, { pickup: true, miles: 9.2, bias: 1.38 }),
  S("bristolfarms", "Bristol Farms", "grocery", FOOD, { pickup: true, miles: 12, bias: 1.42 }),
  S("winco", "WinCo", "grocery", FOOD, { pickup: true, miles: 14, bias: 0.8 }),
  S("dollargeneral", "Dollar General", "grocery", ["groceries", "home", "pharmacy"], { pickup: true, miles: 2.9, bias: 0.86 }),
  S("dollartree", "Dollar Tree", "grocery", ["groceries", "home"], { pickup: true, miles: 1.6, bias: 0.7 }),
  S("familydollar", "Family Dollar", "grocery", ["groceries", "home"], { pickup: true, miles: 2.2, bias: 0.78 }),
  S("seveneleven", "7-Eleven", "grocery", FOOD, { pickup: true, miles: 0.5, bias: 1.45 }),
  S("circlek", "Circle K", "grocery", FOOD, { pickup: true, miles: 1.1, bias: 1.4 }),
  S("instacart", "Instacart", "marketplace", FOOD, { paypal: true, href: "https://www.instacart.com/store/search?q=%s", bias: 1.18 }),
  S("doordash", "DoorDash", "marketplace", FOOD, { paypal: true, href: "https://www.doordash.com/search/store/%s", bias: 1.25 }),
  S("ubereats", "Uber Eats", "marketplace", FOOD, { paypal: true, href: "https://www.ubereats.com/search?q=%s", bias: 1.26 }),

  S("apple", "Apple", "mall", TECH, { pickup: true, miles: 8.0, href: "https://www.apple.com/us/search/%s", bias: 1.18 }),
  S("microsoft", "Microsoft", "mall", TECH, { pickup: true, miles: 8.2, bias: 1.14 }),
  S("samsung", "Samsung", "mall", TECH, { pickup: true, miles: 8.4, bias: 1.1 }),
  S("att", "AT&T", "mall", TECH, { pickup: true, miles: 8.0, bias: 1.2 }),
  S("verizon", "Verizon", "mall", TECH, { pickup: true, miles: 8.0, bias: 1.22 }),
  S("tmobile", "T-Mobile", "mall", TECH, { pickup: true, miles: 3.3, bias: 1.16 }),
  S("hm", "H&M", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.78 }),
  S("forever21", "Forever 21", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.7 }),
  S("gap", "Gap", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.95 }),
  S("oldnavy", "Old Navy", "mall", CLOTHES, { pickup: true, miles: 6.6, bias: 0.82 }),
  S("br", "Banana Republic", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.08 }),
  S("abercrombie", "Abercrombie", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.04 }),
  S("hollister", "Hollister", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.92 }),
  S("ae", "American Eagle", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.9 }),
  S("aerie", "Aerie", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.94 }),
  S("uniqlo", "Uniqlo", "mall", CLOTHES, { pickup: true, miles: 11, bias: 0.88 }),
  S("express", "Express", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 0.93 }),
  S("vs", "Victoria's Secret", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.06 }),
  S("pink", "PINK", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.02 }),
  S("footlocker", "Foot Locker", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.08 }),
  S("champs", "Champs", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.05 }),
  S("finishline", "Finish Line", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.04 }),
  S("journeys", "Journeys", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.0 }),
  S("vans", "Vans", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.02 }),
  S("adidas", "adidas", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.06 }),
  S("nike", "Nike", "mall", CLOTHES, { pickup: true, miles: 8.2, href: "https://www.nike.com/w?q=%s", bias: 1.1 }),
  S("lululemon", "lululemon", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.2 }),
  S("athleta", "Athleta", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.14 }),
  S("alo", "Alo Yoga", "mall", CLOTHES, { pickup: true, miles: 9.4, bias: 1.18 }),
  S("skims", "SKIMS", "shop", CLOTHES, { paypal: true, href: "https://skims.com/search?q=%s", bias: 1.12 }),
  S("gymshark", "Gymshark", "shop", CLOTHES, { paypal: true, href: "https://www.gymshark.com/search?q=%s", bias: 0.96 }),
  S("allbirds", "Allbirds", "shop", CLOTHES, { paypal: true, href: "https://www.allbirds.com/search?q=%s", bias: 1.05 }),
  S("fashionnova", "Fashion Nova", "shop", CLOTHES, { paypal: true, href: "https://www.fashionnova.com/search?q=%s", bias: 0.74 }),
  S("hottopic", "Hot Topic", "mall", [...CLOTHES, "collectibles"], { pickup: true, miles: 8.0, bias: 1.08 }),
  S("boxlunch", "BoxLunch", "mall", [...COLLECT, "clothes"], { pickup: true, miles: 8.0, bias: 1.1 }),
  S("buildabear", "Build-A-Bear", "mall", COLLECT, { pickup: true, miles: 8.0, bias: 1.2 }),
  S("miniso", "MINISO", "mall", ["home", "beauty"], { pickup: true, miles: 8.0, bias: 0.72 }),
  S("daiso", "Daiso", "mall", ["home", "beauty"], { pickup: true, miles: 9.1, bias: 0.55 }),
  S("sunglasshut", "Sunglass Hut", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.22 }),
  S("kay", "Kay Jewelers", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.3 }),
  S("zales", "Zales", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.28 }),
  S("pandora", "Pandora", "mall", CLOTHES, { pickup: true, miles: 8.0, bias: 1.16 }),
  S("macys", "Macy's", "mall", MALL, { pickup: true, miles: 8.3, href: "https://www.macys.com/shop/featured/%s", bias: 1.04 }),
  S("jcpenney", "JCPenney", "mall", MALL, { pickup: true, miles: 7.6, href: "https://www.jcpenney.com/s?searchTerm=%s", bias: 0.9 }),
  S("kohls", "Kohl's", "bigbox", [...CLOTHES, "home", "beauty"], { pickup: true, miles: 5.5, href: "https://www.kohls.com/search.jsp?search=%s", bias: 0.94 }),
  S("tjmaxx", "T.J. Maxx", "bigbox", [...CLOTHES, "home", "beauty"], { pickup: true, miles: 4.7, bias: 0.76 }),
  S("marshalls", "Marshalls", "bigbox", [...CLOTHES, "home"], { pickup: true, miles: 5.0, bias: 0.75 }),
  S("ross", "Ross", "bigbox", CLOTHES, { pickup: true, miles: 3.4, bias: 0.68 }),
  S("burlington", "Burlington", "bigbox", [...CLOTHES, "home"], { pickup: true, miles: 6.2, bias: 0.7 }),
  S("dillards", "Dillard's", "mall", MALL, { pickup: true, miles: 14, bias: 1.06 }),
  S("yankeecandle", "Yankee Candle", "mall", HOME, { pickup: true, miles: 8.0, bias: 1.12 }),
  S("williamssonoma", "Williams Sonoma", "mall", HOME, { pickup: true, miles: 8.4, bias: 1.24 }),
  S("potterybarn", "Pottery Barn", "mall", HOME, { pickup: true, miles: 8.4, bias: 1.26 }),
  S("westelm", "West Elm", "mall", HOME, { pickup: true, miles: 9.0, bias: 1.2 }),
  S("cratebarrel", "Crate & Barrel", "mall", HOME, { pickup: true, miles: 10.2, bias: 1.18 }),
  S("applekiosk", "Apple kiosk", "mall", TECH, { pickup: true, miles: 8.0, bias: 1.18 }),

  S("homedepot", "Home Depot", "bigbox", HOME, { pickup: true, miles: 4.9, href: "https://www.homedepot.com/s/%s", bias: 1.02 }),
  S("lowes", "Lowe's", "bigbox", HOME, { pickup: true, miles: 6.7, href: "https://www.lowes.com/search?searchTerm=%s", bias: 1.03 }),
  S("ikea", "IKEA", "bigbox", HOME, { pickup: true, miles: 18, href: "https://www.ikea.com/us/en/search/products/?q=%s", bias: 0.84 }),
  S("ace", "Ace Hardware", "bigbox", HOME, { pickup: true, miles: 1.9, bias: 1.12 }),
  S("bedbath", "Bed Bath & Beyond", "bigbox", HOME, { href: "https://www.bedbathandbeyond.com/shop/search?keyword=%s", bias: 1.08 }),
  S("wayfair", "Wayfair", "marketplace", HOME, { paypal: true, href: "https://www.wayfair.com/keyword.php?keyword=%s", bias: 0.98 }),
  S("overstock", "Overstock", "marketplace", HOME, { paypal: true, href: "https://www.overstock.com/search?keywords=%s", bias: 0.92 }),
  S("chewy", "Chewy", "marketplace", HOME, { paypal: true, href: "https://www.chewy.com/s?query=%s", bias: 0.96 }),
  S("petco", "Petco", "bigbox", HOME, { pickup: true, miles: 3.7, bias: 1.08 }),
  S("petsmart", "PetSmart", "bigbox", HOME, { pickup: true, miles: 5.3, bias: 1.07 }),
  S("rei", "REI", "bigbox", [...CLOTHES, "home"], { pickup: true, miles: 12.4, href: "https://www.rei.com/search?q=%s", bias: 1.14 }),
  S("dicks", "Dick's", "bigbox", [...CLOTHES, "home"], { pickup: true, miles: 7.8, href: "https://www.dickssportinggoods.com/search?Ntt=%s", bias: 1.06 }),
  S("academy", "Academy", "bigbox", [...CLOTHES, "home"], { bias: 0.94 }),
  S("basspro", "Bass Pro", "bigbox", [...CLOTHES, "home"], { pickup: true, miles: 22, bias: 1.1 }),

  S("gog", "GOG", "digital", GAMES, { paypal: true, href: "https://www.gog.com/en/game/%s", bias: 0.84 }),
  S("epic", "Epic Games", "digital", GAMES, { paypal: false, href: "https://store.epicgames.com/en-US/browse?q=%s", bias: 0.9 }),
  S("playstation", "PlayStation Store", "digital", GAMES, { paypal: false, href: "https://store.playstation.com/search/%s", bias: 1.2 }),
  S("xbox", "Xbox Store", "digital", GAMES, { paypal: false, href: "https://www.xbox.com/en-US/search?q=%s", bias: 1.18 }),
  S("nintendoeshop", "Nintendo eShop", "digital", GAMES, { paypal: false, href: "https://www.nintendo.com/us/search/#q=%s", bias: 1.22 }),
  S("gamebillet", "GameBillet", "digital", GAMES, { paypal: true, href: "https://www.gamebillet.com/catalogsearch/result/?q=%s", bias: 0.86 }),
  S("gamesplanet", "Gamesplanet", "digital", GAMES, { paypal: true, href: "https://us.gamesplanet.com/search?query=%s", bias: 0.88 }),
  S("wingamestore", "WinGameStore", "digital", GAMES, { paypal: true, href: "https://www.wingamestore.com/browse/search/?searchstring=%s", bias: 0.91 }),
  S("gamersgate", "GamersGate", "digital", GAMES, { paypal: true, href: "https://www.gamersgate.com/games?query=%s", bias: 0.87 }),
  S("indiegala", "IndieGala", "digital", GAMES, { paypal: true, href: "https://www.indiegala.com/store/search?key=%s", bias: 0.8 }),
  S("ubisoft", "Ubisoft Store", "digital", GAMES, { paypal: false, href: "https://store.ubisoft.com/us/search?q=%s", bias: 1.05 }),

  S("halfprice", "Half Price Books", "thrift", BOOKS, { pickup: true, miles: 13, href: "https://www.hpb.com/products?keywords=%s", bias: 0.48 }),
  S("powells", "Powell's", "marketplace", BOOKS, { paypal: true, href: "https://www.powells.com/searchresults?keyword=%s", bias: 0.86 }),
  S("bookshop", "Bookshop", "marketplace", BOOKS, { paypal: true, href: "https://bookshop.org/search?keywords=%s", bias: 1.02 }),
  S("kinokuniya", "Kinokuniya", "mall", BOOKS, { pickup: true, miles: 22, href: "https://united-states.kinokuniya.com/products?keywords=%s", bias: 1.08 }),
  S("crunchyroll", "Crunchyroll Store", "shop", BOOKS, { paypal: true, href: "https://store.crunchyroll.com/search?q=%s", bias: 1.04 }),
  S("instocktrades", "InStockTrades", "marketplace", BOOKS, { paypal: true, href: "https://www.instocktrades.com/search?q=%s", bias: 0.7 }),
  S("midtown", "Midtown Comics", "marketplace", BOOKS, { paypal: true, href: "https://www.midtowncomics.com/search?q=%s", bias: 0.98 }),
  S("cgn", "CheapGraphicNovels", "marketplace", BOOKS, { paypal: true, href: "https://www.cheapgraphicnovels.com/search?q=%s", bias: 0.68 }),
  S("booksamillion", "Books-A-Million", "mall", BOOKS, { pickup: true, miles: 18, href: "https://www.booksamillion.com/search?query=%s", bias: 1.03 }),

  S("cargurus", "CarGurus", "auto", CARS, { href: "https://www.cargurus.com/Cars/inventorylisting/viewDetailsFilterViewInventoryListing.action?sourceContext=carGurusHomePage_false_0&entitySelectingHelper.selectedEntity=&q=%s", bias: 0.97 }),
  S("edmunds", "Edmunds", "auto", CARS, { href: "https://www.edmunds.com/inventory/srp.html?inventorytype=used&keyword=%s", bias: 1.0 }),
  S("bringatrailer", "Bring a Trailer", "auction", CARS, { href: "https://bringatrailer.com/search/?s=%s", bias: 1.15 }),
];

export const STORE_MAP = Object.fromEntries(STORES.map((s) => [s.id, s])) as Record<string, Store>;

const TCG_IDS = new Set([
  "tcgplayer",
  "cardkingdom",
  "trollandtoad",
  "coolstuff",
  "amazon",
  "walmart",
  "target",
  "ebay",
  "mercari",
  "offerup",
]);
const GAME_IDS = new Set([
  "steam",
  "gog",
  "humble",
  "fanatical",
  "gmg",
  "epic",
  "playstation",
  "xbox",
  "nintendoeshop",
  "gamebillet",
  "gamesplanet",
  "wingamestore",
  "gamersgate",
  "indiegala",
  "ubisoft",
  "gamestop",
  "amazon",
  "walmart",
  "target",
  "bestbuy",
  "ebay",
  "barnes",
  "offerup",
  "mercari",
  "craigslist",
  "fbmarket",
  "shop",
]);

export function isTradingCard(q: string) {
  const s = q.toLowerCase();
  if (
    /sleeve|sleeves|deck box|playmat|play mat|toploader|top loader|inner sleeve|dragon shield|ultimate guard|katana sleeves|eclipse sleeves|card sleeve|binder pages|penny sleeve/.test(
      s,
    )
  ) {
    return true;
  }
  if (
    /mtg\b|magic:?\s*the gathering|wizards of the coast|\bsorcery\b|planeswalker|pokemon|pokémon|yugioh|yu-?gi-?oh|\btcg\b|trading card|holofoil|charizard|pikachu|sports card|topps|panini|upper deck|tragic arrogance|universes beyond|secret lair/.test(
      s,
    )
  ) {
    return true;
  }
  return /\(([a-z]{3,5}|ffvi|ff[0-9])\)/i.test(s) && /card|magic|foil|rare|mythic|commander|wizards/.test(s);
}

export function isToyQuery(q: string) {
  const s = q.toLowerCase();
  if (/\b(steam|xbox|playstation|\bps[1-5]\b|nintendo|\bswitch\b|videogame|video game|pc game)\b/.test(s)) return false;
  return /\blego[s]?\b|\bduplo\b|playmobil|hot wheels|\bbarbie\b|\bnerf\b|playset|action figure|building (set|bricks?)|\btechnic\b|mega bloks/.test(
    s,
  );
}

const BOOK_IDS = new Set([
  "barnes",
  "amazon",
  "bookshop",
  "target",
  "walmart",
  "kinokuniya",
  "crunchyroll",
  "instocktrades",
  "midtown",
  "cgn",
  "thriftbooks",
  "abebooks",
  "powells",
  "halfprice",
  "booksamillion",
  "ebay",
  "mercari",
  "offerup",
]);

const TOY_IDS = new Set([
  "lego",
  "target",
  "walmart",
  "amazon",
  "ebay",
  "mercari",
  "offerup",
  "costco",
  "bestbuy",
  "kohls",
  "barnes",
  "shop",
]);

export function storesFor(category: Category, name = "") {
  if (isTradingCard(name)) return STORES.filter((s) => TCG_IDS.has(s.id));
  if (isToyQuery(name)) return STORES.filter((s) => TOY_IDS.has(s.id));
  if (category === "games") return STORES.filter((s) => GAME_IDS.has(s.id));
  if (category === "books") return STORES.filter((s) => BOOK_IDS.has(s.id));
  if (category === "groceries") {
    return STORES.filter(
      (s) =>
        s.sells.includes("groceries") &&
        (s.kind === "grocery" || s.kind === "club" || s.kind === "bigbox" || s.kind === "pharmacy"),
    );
  }
  return STORES.filter((s) => s.sells.includes(category));
}

export function storesByKind() {
  const groups = new Map<StoreKind, Store[]>();
  for (const store of STORES) {
    const list = groups.get(store.kind) ?? [];
    list.push(store);
    groups.set(store.kind, list);
  }
  return [...groups.entries()];
}
