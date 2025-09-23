import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';

@Component({
  selector: 'app-all-stocks',
  templateUrl: './all-stocks.page.html',
  styleUrls: ['./all-stocks.page.scss'],
  standalone: false
})
export class AllStocksPage implements OnInit {

  frequency = "Yearly";
  // 18004251199
  // Compare
  // SIP
  // bob
  // sumechem
  // zinc
  // NMDC Steel Ltd.
  // Trident
  stocks: any = [];
  stocksApi: any = [

    // Done: Agricultural: Pesticides & Agrochemicals
    // { "no": 1, "fundamental": "DP04", "type": "bse", "history_price": "507717", "shareholding": "1774.0", "revenue_type": "S", "on_watch": true, "note": "Manufactures of herbicides, insecticides, fungicides, 11 R&D labs" },
    // { "no": 0, "fundamental": "NAL", "type": "bse", "history_price": "544100", "shareholding": "74102.0", "revenue_type": "S", "on_watch": true, "note": "Soil health management, crop nutrition and crop protection products, Newly Listed" },
    // { "no": 2, "fundamental": "BAS", "type": "bse", "history_price": "500042", "shareholding": "59.0", "revenue_type": "S", "on_watch": true, "note": "Agricultural Solutions, Materials, Industrial solutions, Surface Technologies, Nutrition & Care and Chemicals" },
    // { "no": 3, "fundamental": "HSA01", "type": "bse", "history_price": "506285", "shareholding": "62.0", "revenue_type": "S", "on_watch": true, "note": "10 R&D, Crop Protection, Seeds & Traits, Environmental Science, Digital Farming" },
    // { "no": 4, "fundamental": "SUMIC54292", "type": "bse", "history_price": "542920", "shareholding": "23986.0", "revenue_type": "S", "on_watch": true, "note": "Balanced portfolio, Japanese parent, 3 DSIR-approved R&D labs, 25+ patents, agrochemicals, animal nutrition, and environmental health, insecticides, weedicides, fungicides, fumigants, rodenticides, plant growth nutrition products, bio-rationals, and plant growth regulators" },	
    // { "no": 5, "fundamental": "PII", "type": "bse", "history_price": "523642", "shareholding": "2461.0", "revenue_type": "S", "on_watch": true, "note": "Leading player in the agro-chemicals, Agchem CSM Exports, Domestic Agri Brands, Pharma, North America: 44%" },
    // { "no": 0, "fundamental": "DCG", "type": "bse", "history_price": "543687", "shareholding": "76442.0", "revenue_type": "S", "on_watch": true, "note": "Agrochemical formulations, Insecticide, Herbicides, Fungicides, Micro-Fertilizers" },

    // Done: Agricultural: Aquaculture
    // { "no": 0, "fundamental": "VAF01", "type": "bse", "history_price": "530215", "shareholding": "4919.0", "revenue_type": "S", "on_watch": false, "note": "Operates aquaculture farms, Creating infrastructure" },

    // Done: Agricultural: Fertilizer
    // { "no": "0", "fundamental": "PHOSP54212", "type": "bse", "history_price": "542123", "shareholding": "13550.0", "revenue_type": "C", "on_watch": true, "note": "Phosphate Fertilizer manufacturer in Eastern India" },
    // { "no": "1", "fundamental": "AA13", "type": "nse", "history_price": "ARIES", "shareholding": "12476.0", "revenue_type": "C", "on_watch": true, "note": "134 brands, 21 organically certified productsm, Micronutrients, Water Soluble NPK, Organic and Bio Products" },
    // { "no": "2", "fundamental": "GSF", "type": "nse", "history_price": "GSFC", "shareholding": "226.0", "revenue_type": "C", "on_watch": true, "note": "PSU, Fertilizer products (78%), Industrial products (22%), Green Hydrogen Project, 5549 investments in various listed and unlisted companies" },
    // { "no": "", "fundamental": "MCF01", "type": "nse", "history_price": "MANGCHEFER", "shareholding": "368.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "ZAC", "type": "nse", "history_price": "ZUARI", "shareholding": "42328.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "CF06", "type": "nse", "history_price": "COROMANDEL", "shareholding": "123.0", "revenue_type": "C", "on_watch": false, "note": "" },

    // Done: Agricultural: Agriculture
    // { "no": "1", "fundamental": "BBT", "type": "nse", "history_price": "BBTC", "shareholding": "84.0", "revenue_type": "C", "on_watch": false, "note": "Food-Bakery & Dairy Products (96%), Investments (2%), Auto Electrical Components" },
    // { "no": "2", "fundamental": "MS27", "type": "bse", "history_price": "539275", "shareholding": "55355.0", "revenue_type": "C", "on_watch": false, "note": "Production, processing and marketing of Hybrid and GM seeds" },
    // { "no": "", "fundamental": "HA01", "type": "bse", "history_price": "519574", "shareholding": "4569.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "STG", "type": "bse", "history_price": "506166", "shareholding": "2981.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "MGEL14874", "type": "nse", "history_price": "MGEL", "shareholding": "74592.0", "revenue_type": "C", "on_watch": false, "note": "" },

    // Done: Apparel & Accessories: Diamond & Jewellery
    // { "no": "0", "fundamental": "MJL", "type": "nse", "history_price": "MOTISONS", "shareholding": "77893.0", "revenue_type": "S", "on_watch": true, "note": "" }, 
    // { "no": "", "fundamental": "TI01", "type": "nse", "history_price": "TITAN", "shareholding": "1016.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "SG16", "type": "nse", "history_price": "SENCO", "shareholding": "33975.0", "revenue_type": "C", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "SG14", "type": "nse", "history_price": "SKYGOLD", "shareholding": "73265.0", "revenue_type": "C", "on_watch": false, "note": "" }, 
    // { "no": "", "fundamental": "DPA01", "type": "nse", "history_price": "DPABHUSHAN", "shareholding": "71563.0", "revenue_type": "C", "on_watch": false, "note": "" }, 
    // { "no": "", "fundamental": "KJ", "type": "bse", "history_price": "540953", "shareholding": "71814.0", "revenue_type": "S", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "RJI", "type": "nse", "history_price": "RADHIKAJWE", "shareholding": "68727.0", "revenue_type": "S", "on_watch": false, "note": "" },

    // Done: Apparel & Accessories: Watches & Accessories
    // { "no": "1", "fundamental": "KD05", "type": "nse", "history_price": "KDDL", "shareholding": "2631.0", "revenue_type": "S", "on_watch": true, "note": "Watch & Accessories(76%), Watch Components(24%), India: 79%, Switzerland: 16%" },

    // Done: Apparel & Accessories: Footwear
    // { "no": "", "fundamental": "LP08", "type": "bse", "history_price": "532829", "shareholding": "27275.0", "revenue_type": "S", "on_watch": false, "note": "Mass footwear manufacturer and brand distribution company" },

    // Done: Automobile & Ancillaries: Auto Ancillary
    // { "no": "1", "fundamental": "SSW01", "type": "nse", "history_price": "SSWL", "shareholding": "1338.0", "revenue_type": "C", "on_watch": true, "note": "Leading manufacturer of automotive wheel rims for passenger vehicles, heavy commercial vehicles, tractors, OTRs, and 2W & 3W, Tata Steel has held a 6.97% stake, Nippon Steel & Sumitomo Metal Corporation holds 5.45% since 2010, offering expertise in steel quality and technological advancement", "name": "Steel Strips Wheels" },
    // { "no": "2", "fundamental": "HC06", "type": "nse", "history_price": "HINDCOMPOS", "shareholding": "253.0", "revenue_type": "C", "on_watch": true, "note": " Friction Materials in India comprising Brake Lining, Clutch Facing, Disc Brake Pad, Roll Lining, Brake Block, etc. Company is also engaged in the treasury business, Automotive, Railways, Engineering, Mining, Aerospace, Steel, Chemical, Oil Exploration etc", "name": "Hindustan Composites" },
    // { "no": "3", "fundamental": "BPI", "type": "nse", "history_price": "BANCOINDIA", "shareholding": "991.0", "revenue_type": "C", "on_watch": true, "note": "Engine cooling modules such as radiators, charged air coolers, fuel coolers, oil coolers, AC condensers, deaeration plastic tanks, metal-layered gaskets, and hybrid elastomeric molded gaskets.", "name": "Banco Products (India)" },
    // { "no": "", "fundamental": "SG04", "type": "nse", "history_price": "SHANTIGEAR", "shareholding": "968.0", "revenue_type": "S", "on_watch": true, "note": "Design, manufacture, supply and servicing of gears and gear boxes, OB:340", "name": "Shanthi Gears" },
    // { "no": "", "fundamental": "WAB", "type": "nse", "history_price": "ZFCVINDIA", "shareholding": "28069.0", "revenue_type": "C", "on_watch": true, "note": "Market leader for advanced braking systemscompressors, air supply units, vacuum pumps, actuators, and push-type connectors", "name": "ZF Commercial" },
    // { "no": "", "fundamental": "FIE", "type": "nse", "history_price": "FIEMIND", "shareholding": "25040.0", "revenue_type": "C", "on_watch": true, "note": "Leader in automotive lighting & signaling equipment and rearview mirrors to Two-wheeler and Four-wheeler", "name": "FIEM Industries Ltd." },
    // { "no": "", "fundamental": "LAT", "type": "nse", "history_price": "LUMAXTECH", "shareholding": "23562.0", "revenue_type": "C", "on_watch": true, "note": "Leading manufacturer of gear shifters & interior solutions in India, with more than 80% market share across all passenger vehicle customers. OB: 1050", "name": "Lumax Auto Technologies" },
    // { "no": "", "fundamental": "KL01", "type": "nse", "history_price": "KROSS", "shareholding": "92335.0", "revenue_type": "S", "on_watch": true, "note": "Trailer axles & suspension assemblies and safety critical components for the M&HCV and farm equipment segments", "name": "Kross" },
    // { "no": "", "fundamental": "HHS", "type": "bse", "history_price": "505893", "shareholding": "616.0", "revenue_type": "S", "on_watch": true, "note": "Designing and manufacturing of Propeller Shafts, which are mechanical devices that transfer power from engines or motors to the point of application", "name": "Hindustan Hardy" },
    // { "no": "", "fundamental": "RI10", "type": "nse", "history_price": "REMSONSIND", "shareholding": "5266.0", "revenue_type": "C", "on_watch": false, "note": "Mechanical Components, Electronicsm, Lighting Solutions, exports majorly to UK, Europe, North American, Brazil, Mexico and SAARC countries, Next Gen Product, Remsons 2.0", "name": "Remsons Industries" },
    // { "no": "", "fundamental": "BS03", "type": "nse", "history_price": "BHARATSE", "shareholding": "1138.0", "revenue_type": "S", "on_watch": false, "note": "Complete seating system, joint Venture of Suzuki Motor Corporation Japan, Maruti Suzuki India, and hold a combined equity stake of 29.6% of BSL", "name": "Bharat Seats" },
    // { "no": "", "fundamental": "MI44", "type": "nse", "history_price": "UNOMINDA", "shareholding": "12295.0", "revenue_type": "C", "on_watch": false, "note": "25+ types of components and systems, acoustics, switches, lights, alloy wheels, and seats, leadership position in India, 37 R&D", "name": "UNO Minda" },
    // { "no": "", "fundamental": "GI02", "type": "nse", "history_price": "GABRIEL", "shareholding": "184.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Shock absorbers, struts and front forks, collaborations with Yamaha Motor Hydraulic Systems (Japan), KYB Corporation (Japan), KONI B.V. (Netherlands) across various products" },
    // { "no": "", "fundamental": "CA07", "type": "nse", "history_price": "CRAFTSMAN", "shareholding": "27871.0", "revenue_type": "C", "on_watch": false, "note": "Leading player in machining critical engine, automotive Aluminium space, a leading player in the automated storage market,", "name": "Craftsman Automation Ltd." },
    // { "no": "", "fundamental": "MIC", "type": "nse", "history_price": "BOSCHLTD", "shareholding": "378.0", "revenue_type": "C", "on_watch": false, "note": "High Price", "name": "Bosch" },
    // { "no": "", "fundamental": "SBP04", "type": "nse", "history_price": "SONACOMS", "shareholding": "18341.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Sona BLW Precision Forgings" },
    // { "no": "", "fundamental": "SC", "type": "nse", "history_price": "TVSHLTD", "shareholding": "538.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "ZF Commercial" },
    // { "no": "", "fundamental": "SE30", "type": "nse", "history_price": "SANSERA", "shareholding": "39378.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Gabriel India" },
    // { "no": "", "fundamental": "PIC01", "type": "nse", "history_price": "PRICOLLTD", "shareholding": "67610.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Pricol Ltd." },
    // { "no": "", "fundamental": "SMI04", "type": "nse", "history_price": "SHARDAMOTR", "shareholding": "7065.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Sharda Motor Industries" },
    // { "no": "", "fundamental": "LGB", "type": "nse", "history_price": "LGBBROSLTD", "shareholding": "1927.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "LG Balakrishnan & Bros" },
    // { "no": "", "fundamental": "SSS", "type": "nse", "history_price": "JTEKTINDIA", "shareholding": "1054.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "JTEKT India" },
    // { "no": "", "fundamental": "E09", "type": "nse", "history_price": "SJS", "shareholding": "68304.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "SJS Enterprises" },
    // { "no": "", "fundamental": "GI09", "type": "nse", "history_price": "FMGOETZE", "shareholding": "197.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Federal-Mogul Goetze (India)" },
    // { "no": "", "fundamental": "TAC", "type": "nse", "history_price": "TALBROAUTO", "shareholding": "549.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "Talbros Automotive Components" },
    // { "no": "", "fundamental": "NAC02", "type": "nse", "history_price": "543214", "shareholding": "74755.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "NDR Auto Components" },
    // { "no": "", "fundamental": "RAC", "type": "nse", "history_price": "RACLGEAR", "shareholding": "1194.0", "revenue_type": "C", "on_watch": false, "note": "", "name": "RACL Geartech" },
    // { "no": "", "fundamental": "JLL", "type": "bse", "history_price": "530711", "shareholding": "5339.0", "revenue_type": "S", "on_watch": false, "note": "", "name": "Jagan Lamps" },
    // { "no": "", "fundamental": "UWL", "type": "nse", "history_price": "URAVIDEF", "shareholding": "72173.0", "revenue_type": "S", "on_watch": false, "note": "", "name": "Uravi Defence and Technology" },

    // Automobile & Ancillaries: Automobile Two & Three Wheelers
    // { "no": "", "fundamental": "OEM", "type": "nse", "history_price": "OLAELEC", "shareholding": "75559.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // Bajaj Auto
    // Eicher Motors
    // TVS Motor Company
    // Hero MotoCorp
    // { "no": "", "fundamental": "OEM", "type": "nse", "history_price": "OLAELEC", "shareholding": "75559.0", "revenue_type": "C", "on_watch": false, "name": "OLA Electric Mobility", "note": "" },
    // Ather Energy
    // Wardwizard Innov

    // Automobiles-Tractors
    // Indo Farm Equipments

    // Bearings


    // { "no": "", "fundamental": "TEL", "type": "nse", "history_price": "TATAMOTORS", "shareholding": "560.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "ARB", "type": "nse", "history_price": "ARE%26M", "shareholding": "2110.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "SNP", "type": "nse", "history_price": "HBLENGINE", "shareholding": "2401.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "EI", "type": "nse", "history_price": "EXIDEIND", "shareholding": "111.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "HEB", "type": "bse", "history_price": "504176", "shareholding": "1486.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "EII02", "type": "nse", "history_price": "EVEREADY", "shareholding": "578.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "IN01", "type": "nse", "history_price": "NIPPOBATRY", "shareholding": "667.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" },
    // { "no": "", "fundamental": "LN", "type": "bse", "history_price": "504093", "shareholding": "334.0", "revenue_type": "C", "on_watch": false, "name": "", "note": "" }

    // Done: Energy: Power Generation/Distribution
    // { "no": "1", "fundamental": "NBF01", "type": "nse", "history_price": "NAVA", "shareholding": "3780.0", "revenue_type": "C", "on_watch": true, "note": "434 MW, Energy (75%), Ferro Alloys (19%), Mining (6%), Healthcare, Agri-Business" },
    // { "no": "2", "fundamental": "TPC", "type": "nse", "history_price": "TATAPOWER", "shareholding": "554.0", "revenue_type": "C", "on_watch": true, "note": "Aims to achieve 100% clean energy, Transmission & Distribution (62%), Thermal & Hydro Power Generation (24%), Renewables (13%)" },
    // { "no": "3", "fundamental": "SA13", "type": "nse", "history_price": "WAAREERTL", "shareholding": "42529.0", "revenue_type": "C", "on_watch": true, "note": "12 GW, Chikhli, Surat and Umbergaon in Gujarat" },
    // { "no": "0", "fundamental": "SEP02", "type": "nse", "history_price": "SAMPANN", "shareholding": "41535.0", "revenue_type": "C", "on_watch": true, "note": "800 KW, Non-Conventional Energy:5%, Reclaimed Rubber Division:95%" },
    // { "no": "0", "fundamental": "AP26", "type": "nse", "history_price": "ADANIPOWER", "shareholding": "17808.0", "revenue_type": "C", "on_watch": false, "note": "Using Coal, Operational capacity: 17,550 MW, Under-construction projects: 4,520 MW, Under-construction projects: 4,520 MW, Total target capacity:** 30,670 MW by 2032" },
    // { "no": "", "fundamental": "PGC", "type": "nse", "history_price": "POWERGRID", "shareholding": "5455.0", "revenue_type": "C", "on_watch": false, "note": "Transmission (95%), Telecom Business (2%), Consultancy Services & Other (3%), OB:86,700, Renewable Energy, Battery Energy Storage Systems, Green Hydrogen, Largest electric power transmission company" },
    // { "no": "", "fundamental": "BFU", "type": "nse", "history_price": "BFUTILITIE", "shareholding": "8037.0", "revenue_type": "C", "on_watch": false, "note": "14.65 MW, Wind Mills, 226 Cr. in mutual funds" },
    // { "no": "", "fundamental": "CES", "type": "nse", "history_price": "CESC", "shareholding": "99.0", "revenue_type": "C", "on_watch": false, "note": " 2,140 MW, RPSG" },
    // { "no": "", "fundamental": "ADANI54145", "type": "nse", "history_price": "ADANIGREEN", "shareholding": "70666.0", "revenue_type": "C", "on_watch": false, "note": "64,858 Debt, 10.9 GW, 11 GW under execution, 2nd largest Solar PV developer in the world" },

    // Done: Finance: Finance Term Lending
    // { "no": "3", "fundamental": "IRF", "type": "nse", "history_price": "IRFC", "shareholding": "12854.0", "revenue_type": "S", "on_watch": true, "note": "Acquisition / creation of assets, leased out to the Indian Railways" },
    // { "no": "", "fundamental": "MFS09", "type": "nse", "history_price": "MASFIN", "shareholding": "38599.0", "revenue_type": "S", "on_watch": false, "note": "" },
    // { "no": "", "fundamental": "SCN", "type": "nse", "history_price": "SATIN", "shareholding": "16093.0", "revenue_type": "S", "on_watch": false, "note": "" },

    // Done: FMCG: Breweries Distilleries    
    // { "fundamental": "GMB", "type": "nse", "history_price": "GMBREW", "shareholding": "3240.0", "revenue_type": "S", "on_watch": true }, // 1,466 // Low PE, High Growth + High Div, High Div Growth	
    // { "fundamental": "SV05", "type": "bse", "history_price": "543711", "shareholding": "72935.0", "revenue_type": "S", "on_watch": true }, // 2,326 // Low PE, High Growth
    // { "fundamental": "MC08", "type": "nse", "history_price": "UNITDSPR", "shareholding": "8036.0", "revenue_type": "S", "on_watch": true }, // 1,07,422 // High PE, High Growth + ?? // India's largest alcoholic beverages
    // { "fundamental": "PAI03", "type": "bse", "history_price": "530305", "shareholding": "4946.0", "revenue_type": "S", "on_watch": false }, // High PE, High Growth
    // { "fundamental": "TI09", "type": "nse", "history_price": "TI09", "shareholding": "3388.0", "revenue_type": "S", "on_watch": false },     //4,617 // Low PE, 
    // { "fundamental": "UBB", "type": "nse", "history_price": "UBL", "shareholding": "23220.0", "revenue_type": "S", "on_watch": false },     // 53,396 // High PE 	
    // { "fundamental": "JI01", "type": "bse", "history_price": "JAGAJITIND", "shareholding": "307.0", "revenue_type": "S", "on_watch": false },

    // Done: Industries: Real Estate : Construction - Residential & Commercial Complexes
    // { "no": 1, "fundamental": "ARI", "type": "nse", "history_price": "ANANTRAJ", "shareholding": "1538.0", "revenue_type": "S", "on_watch": true, "note": "Diversify real estate, 6 MW Data Center, Holds 83.43 acres land in Delhi NCR for future developments." },
    // { "no": 0, "fundamental": "DBEIL", "type": "nse", "history_price": "DBEIL", "shareholding": "7553.0", "revenue_type": "S", "on_watch": true, "note": "Diversify construction, historic memorial, Punjab and Haryana contributed 80% OB:1380", },
    // { "no": 2, "fundamental": "GHF", "type": "nse", "history_price": "GANESHHOUC", "shareholding": "3446.0", "revenue_type": "S", "on_watch": true, "note": "Organized housing and construction" },
    // { "no": 3, "fundamental": "D04", "type": "nse", "history_price": "DLF", "shareholding": "6890.0", "revenue_type": "S", "on_watch": true, "note": "Cyber cities Rental Income, Power gen., hospitality" },
    // { "no": 4, "fundamental": "SED01", "type": "nse", "history_price": "SURAJEST", "shareholding": "76563.0", "revenue_type": "S", "on_watch": false, "note": "Leadership in Redevelopment, South Central Mumbai, residential and commercial real estate, Luxury segment" },
    // { "fundamental": "AI52", "type": "nse", "history_price": "AGIIL", "shareholding": "65734.0", "revenue_type": "S", "on_watch": false },    // 1,965     // Low PE, High Growth + Low Div snd Low Div Growth                                  // Based onJalandhar, Punjab, Forbes Asia’s "Best Under A Billion"
    // { "fundamental": "ADL02", "type": "nse", "history_price": "ARKADE", "shareholding": "91895.0", "revenue_type": "S", "on_watch": false }, // Low PE, High Growth + No Div                    // Focused Mumbai
    // { "fundamental": "RFL03", "type": "nse", "history_price": "531694", "shareholding": "14960.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "RIP01", "type": "nse", "history_price": "RPPINFRA", "shareholding": "36162.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "ACI12", "type": "nse", "history_price": "AHLUCONT", "shareholding": "7310.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "AHF01", "type": "nse", "history_price": "ASHIANA", "shareholding": "2769.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "MD04", "type": "nse", "history_price": "LODHA", "shareholding": "35713.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "GP11", "type": "nse", "history_price": "GODREJPROP", "shareholding": "15613.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "GP11", "type": "nse", "history_price": "GODREJPROP", "shareholding": "15613.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "PM02", "type": "nse", "history_price": "PHOENIXLTD", "shareholding": "6418.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "OR", "type": "nse", "history_price": "OBEROIRLTY", "shareholding": "38045.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "BE08", "type": "nse", "history_price": "BRIGADE", "shareholding": "28294.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "SPS01", "type": "nse", "history_price": "AJMERA", "shareholding": "2404.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "CI31", "type": "nse", "history_price": "CAPACITE", "shareholding": "70490.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "AI66", "type": "nse", "history_price": "ARVSMART", "shareholding": "40790.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "SMC07", "type": "nse", "history_price": "ARIHANTSUP", "shareholding": "7101.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "SP43", "type": "nse", "history_price": "SHRIRAMPPS", "shareholding": "66145.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "SBG", "type": "nse", "history_price": "SBGLP", "shareholding": "74689.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "GIS", "type": "nse", "history_price": "526117", "shareholding": "3190.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "VC13", "type": "nse", "history_price": "531822", "shareholding": "15194.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "TS06", "type": "nse", "history_price": "531814", "shareholding": "7254.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "RPP03", "type": "nse", "history_price": "502445", "shareholding": "483.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "DIT01", "type": "nse", "history_price": "539405", "shareholding": "54858.0", "revenue_type": "S", "on_watch": false },
    // { "fundamental": "UHD", "type": "bse", "history_price": "532016", "shareholding": "7553.0", "revenue_type": "S", "on_watch": false },

    // Done: Industries: Ship Building
    // { "fundamental": "MDS01", "type": "nse", "history_price": "MAZDOCK", "shareholding": "12963.0", "revenue_type": "S", "on_watch": true }, // 98,124 // Low PE, High Growth + High Div + High Div Growth   // Construction of warships and submarines 
    // { "fundamental": "GRS01", "type": "nse", "history_price": "GRSE", "shareholding": "13229.0", "revenue_type": "S", "on_watch": true },    //18,501  // High PE, High Growth + High Div + High Div Growth  // Construction of warships and auxiliary vessels
    // { "fundamental": "CS17", "type": "nse", "history_price": "COCHINSHIP", "shareholding": "5762.0", "revenue_type": "S", "on_watch": false },

    // Done: Raw Material: Carbon Black
    // { "fundamental": "PCB01", "type": "nse", "history_price": "PCBL", "shareholding": "435.0", "revenue_type": "S", "on_watch": true },      // 15,649 // High PE, Moderate Growth + Low Div + Low Div Growth // Leading Indian manufacturer of carbon black
    // { "fundamental": "GC04", "type": "nse", "history_price": "GOACARBON", "shareholding": "196.0", "revenue_type": "S", "on_watch": false }, //406 //Low PE, Low Growth + ?? //


    // { "fundamental": "RI", "type": "nse", "history_price": "RELIANCE", "shareholding": "476.0", "revenue_type": "S", "on_watch": false },

    // { "main_sector": "Agri", "sub_sector": "Agriculture", "fundamental": "DCS03", "type": "nse", "history_price": "DHANLAXMI", "shareholding": "93634.0", "revenue_type": "S", "company": "Dhanlaxmi Crop Science", "on_watch": true },
    // { "main_sector": "Agri", "sub_sector": "Food Processing", "fundamental": "GRM01", "type": "nse", "history_price": "GRMOVER", "shareholding": "13554.0", "revenue_type": "S", "company": "GRM Overseas", "on_watch": false },

    // { "main_sector": "Aviation", "sub_sector": "Aerospace & Defence", "fundamental": "UAM", "type": "nse", "history_price": "UNIMECH", "shareholding": "93631.0", "revenue_type": "S", "company": "Unimech Aerospace and Manufacturing", "on_watch": false },

    // { "main_sector": "Banks", "sub_sector": "Bank - Private", "fundamental": "IIB", "type": "nse", "history_price": "INDUSINDBK", "shareholding": "5531.0", "revenue_type": "S", "company": "IndusInd Bank", "on_watch": true },

    // { "main_sector": "Capital Goods", "sub_sector": "Engineering - Industrial Equipments", "fundamental": "GE08", "type": "nse", "history_price": "GENSOL", "shareholding": "74100.0", "revenue_type": "S", "company": "Gensol Engineering", "on_watch": true },

    // { "main_sector": "Consumer Durables", "sub_sector": "Air Conditioners", "fundamental": "AEI01", "type": "nse", "history_price": "AMBER", "shareholding": "45967.0", "revenue_type": "S", "company": "Amber Enterprises India Limited", "on_watch": false },
    // { "main_sector": "Consumer Durables", "sub_sector": "Electronic Goods", "fundamental": "DT07", "type": "nse", "history_price": "DIXON", "shareholding": "35727.0", "revenue_type": "S", "company": "Dixon Technologies", "on_watch": false },

    // { "main_sector": "Castings & Forgings", "sub_sector": "Castings & Forgings", "fundamental": "TT02", "type": "nse", "history_price": "505685", "shareholding": "1810.0", "revenue_type": "S", "company": "Taparia Tools", "on_watch": true },

    // No Data
    // { "main_sector": "Chemicals", "sub_sector": "Batteries", "Fertilizers": "DFP", "type": "nse", "history_price": "DEEPAKFERT", "shareholding": "135.0", "revenue_type": "C", "company": "Deepak Fertilisers", "on_watch": false },

    // { "main_sector": "Chemicals", "sub_sector": "Speciality Chemicals", "fundamental": "A06", "type": "nse", "history_price": "ATUL", "shareholding": "43.0", "revenue_type": "S", "company": "Atul", "on_watch": false },

    // { "main_sector": "Diversified ", "sub_sector": "Diversified ", "fundamental": "ITC", "type": "nse", "history_price": "ITC", "shareholding": "301.0", "revenue_type": "S", "company": "ITC", "on_watch": true },
    // { "main_sector": "Diversified", "sub_sector": "Diversified", "fundamental": "BLC", "type": "nse", "history_price": "BALMLAWRIE", "shareholding": "732.0", "revenue_type": "S", "company": "Balmer Lawrie & Co", "on_watch": true },

    // { "main_sector": "Finance", "sub_sector": "Finance - Housing", "fundamental": "BHFL", "type": "nse", "history_price": "BAJAJHFL", "shareholding": "67886.0", "revenue_type": "S", "company": "Bajaj Housing Finance", "on_watch": true },
    // { "main_sector": "Finance", "sub_sector": "Finance - Stock Broking", "fundamental": "B03", "type": "nse", "history_price": "BSE", "shareholding": "21236.0", "revenue_type": "S", "company": "BSE Limited", "on_watch": true },

    // { "main_sector": "FMCG", "sub_sector": "Cigarettes/Tobacco", "fundamental": "GPI", "type": "nse", "history_price": "GODFRYPHLP", "shareholding": "657.0", "revenue_type": "S", "company": "Godfrey Phillips India", "on_watch": true },
    // { "main_sector": "FMCG", "sub_sector": "Consumer Food", "fundamental": "HAI", "type": "nse", "history_price": "HMAAGRO", "shareholding": "76650.0", "revenue_type": "S", "company": "HMA Agro Industries", "on_watch": false },

    // { "main_sector": "Healthcare", "sub_sector": "Pharmaceuticals & Drugs", "fundamental": "BD04", "type": "nse", "history_price": "BETA", "shareholding": "71606.0", "revenue_type": "S", "company": "Beta Drugs", "on_watch": true },
    // { "main_sector": "Healthcare", "sub_sector": "Pharmaceuticals & Drugs", "fundamental": "C", "type": "nse", "history_price": "CIPLA", "shareholding": "114.0", "revenue_type": "S", "company": "Cipla", "on_watch": true },z

    // { "main_sector": "Hospitality", "sub_sector": "Travel Services", "fundamental": "TTL03", "type": "nse", "history_price": "TBOTEK", "shareholding": "69551.0", "revenue_type": "S", "company": "TBO Tek", "on_watch": true },
    // { "main_sector": "Hospitality", "sub_sector": "Hotel, Resort & Restaurants", "fundamental": "JCIL", "type": "bse", "history_price": "544304", "shareholding": "75082.0", "revenue_type": "S", "company": "Jungle Camps India", "on_watch": true },

    // { "main_sector": "Power", "sub_sector": "Power Generation/Distribution", "fundamental": "IREDAL", "type": "nse", "history_price": "IREDA", "shareholding": "15550.0", "revenue_type": "S", "company": "Indian Renewable Energy Development Agency", "on_watch": true },

    // { "main_sector": "Infrastructure", "sub_sector": "Engineering & Construction", "fundamental": "II21", "type": "nse", "history_price": "IRCON", "shareholding": "5497.0", "revenue_type": "S", "company": "Ircon International", "on_watch": false },
    // { "main_sector": "Infrastructure", "sub_sector": "Infrastructure", "fundamental": "HIE", "type": "nse", "history_price": "HGINFRA", "shareholding": "71631.0", "revenue_type": "S", "company": "HG Infra Engineering Ltd.", "on_watch": true },

    // { "main_sector": "Media & Entertainment", "sub_sector": "Film Production, Distribution & Entertainment", "fundamental": "IBS02", "type": "nse", "history_price": "IDENTICAL", "shareholding": "93645.0", "revenue_type": "S", "company": "Identical Brains Studios", "on_watch": true },

    // { "main_sector": "Metals & Mining", "sub_sector": "Metals - Non Ferrous", "fundamental": "SG", "type": "nse", "history_price": "VEDL", "shareholding": "502.0", "revenue_type": "S", "company": "Vedanta  ", "on_watch": true },

    // { "main_sector": "Oil & Gas", "sub_sector": "Refineries", "fundamental": "IOC", "type": "nse", "history_price": "IOC", "shareholding": "12002.0", "revenue_type": "S", "company": "Indian Oil Corporation", "on_watch": false },
    // { "main_sector": "Oil & Gas", "sub_sector": "Refineries", "fundamental": "MR", "type": "nse", "history_price": "CHENNPETRO", "shareholding": "2339.0", "revenue_type": "S", "company": "Chennai Petroleum Corporation", "on_watch": false },

    // { "main_sector": "Software & IT Services", "sub_sector": "Software", "fundamental": "TEI", "type": "nse", "history_price": "TATAELXSI", "shareholding": "2322.0", "revenue_type": "S", "company": "Tata Elxsi", "on_watch": true },
    // { "main_sector": "Software & IT Services", "sub_sector": "IT Services & Consulting", "fundamental": "FIC", "type": "nse", "history_price": "ZENSARTECH", "shareholding": "262.0", "revenue_type": "S", "company": "Zensar Technologies", "on_watch": true },
    // { "main_sector": "Software & IT Services", "sub_sector": "IT Services & Consulting", "fundamental": "AI72", "type": "nse", "history_price": "AFFLE", "shareholding": "73060.0", "revenue_type": "S", "company": "Affle India", "on_watch": true },
    // { "main_sector": "Software & IT Services", "sub_sector": "IT Services & Consulting", "fundamental": "W", "type": "nse", "history_price": "WIPRO", "shareholding": "614.0", "revenue_type": "S", "company": "Wipro", "on_watch": false },
    // { "main_sector": "Software & IT Services", "sub_sector": "IT Services & Consulting", "fundamental": "PS15", "type": "nse", "history_price": "PERSISTENT", "shareholding": "18286.0", "revenue_type": "S", "company": "Persistent Systems", "on_watch": true },

    // { "main_sector": "Telecom", "sub_sector": "Telecommunication - Service Provider", "fundamental": "IC8", "type": "nse", "history_price": "IDEA", "shareholding": "23040.0", "revenue_type": "S", "company": "Vodafone Idea", "on_watch": false },

    // { "main_sector": "Textiles", "sub_sector": "Textiles", "fundamental": "MSM", "type": "nse", "history_price": "VTL", "shareholding": "932.0", "revenue_type": "S", "company": "Vardhman Textiles", "on_watch": false },

    // { "main_sector": "Trading", "sub_sector": "Trading", "fundamental": "TAR", "type": "nse", "history_price": "BALAXI", "shareholding": "22472.0", "revenue_type": "S", "company": "Balaxi Pharmaceuticals", "on_watch": false },
  ];

  constructor(
    private http: HttpClient
  ) { }

  ngOnInit() {
    // this.fetchStockData();
    // setInterval(() => {
      this.fetchStockData();
    // }, 2000);
  }

  fetchStockData() {
    // 1. Build an array of all requests (one per stock)
    const requests = this.stocksApi.map((stock: any) => {
      const priceApiUrl = `https://priceapi.moneycontrol.com/pricefeed/${stock.type}/equitycash/${stock.fundamental}`;
      return this.http.get<any>(priceApiUrl).pipe(
        map(priceData => {
          // put your value extraction here exactly as before
          if (!priceData?.data) return null;

          const currentPrice = priceData.data.pricecurrent && priceData.data.pricecurrent != "NT*" ? Number(priceData.data.pricecurrent).toFixed(2) : "";
          const high52 = priceData.data['52H'] && priceData.data['52H'] != "-" ? priceData.data['52H'] : "";
          const low52 = priceData.data['52L'] && priceData.data['52L'] != "-" ? priceData.data['52L'] : "";
          const percentFrom52High = high52 ? ((Number(currentPrice) - high52) / high52 * 100).toFixed(2) : "";
          const percentFrom52Low = low52 ? ((Number(currentPrice) - low52) / low52 * 100).toFixed(2) : "";

          return {
            "YM": stock.revenue_type,
            "NSE": priceData.data.NSEID,
            "COMPANY_NAME": priceData.data.SC_FULLNM,
            "MAIN_SECTOR": priceData?.data?.main_sector,
            "SUB_SECTOR": priceData?.data?.newSubsector,
            "CURRENT_PRICE": currentPrice,
            "52H": high52,
            "52L": low52,
            "52H_PERCENTAGE": percentFrom52High,
            "52L_PERCENTAGE": percentFrom52Low,
            "BOOK_VALUE": priceData.data.BVCONS ? Number(priceData.data.BVCONS).toFixed(2) : "",
            "MARKET_CAP": priceData.data.MKTCAP && priceData.data.MKTCAP != "-" ? Number(priceData.data.MKTCAP).toFixed(2) : "",
            "PE_RATIO": priceData.data.PE && priceData.data.PE != "-" ? Number(priceData.data.PE).toFixed(2) : "",
            "SECTOR_PE": priceData.data.IND_PE ? Number(priceData.data.IND_PE) : "",
            "PB_RATIO": priceData.data.PB && priceData.data.PB != "-" ? Number(priceData.data.PB).toFixed(2) : "",
            // add more fields as needed
          }
        })
      );
    });

    // 2. Make ALL the requests and handle at once
    forkJoin(requests).subscribe((results: any) => {
      // Remove any nulls (failed fetches)
      this.stocks = results.filter((r: any) => r !== null);
      // 3. Sort by MARKET_CAP (descending)
      this.stocks.sort((a: any, b: any) => (Number(a.MARKET_CAP) || 0) - (Number(b.MARKET_CAP) || 0));
      // 4. Optional: force new reference if needed (not usually needed after assignment):
      this.stocks = [...this.stocks];
    });
  }

  getYearlyRevenue(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, 'text/html');

        // Try to get data from JSON elements first
        const dataElement = doc.querySelector("#C-12-income-graphData") || doc.querySelector("#S-12-income-graphData");
        const dateElement = doc.querySelector("#C-12-income-graphDate") || doc.querySelector("#S-12-income-graphDate");

        if (dataElement && dateElement) {
          // Handle JSON format
          try {
            const revenueData = JSON.parse(dataElement.textContent || '{}');
            const revenueDates = JSON.parse(dateElement.textContent || '[]');

            return revenueDates.map((date: string, index: number) => {
              const totalIncome = parseFloat(revenueData["total-income"][index]);
              const netProfit = parseFloat(revenueData["net-profit"][index]);
              const interest = revenueData["interest"] ? parseFloat(revenueData["interest"][index]) : null;
              const interestEarned = revenueData["interest-earned"] ? parseFloat(revenueData["interest-earned"][index]) : null;

              let revenueGrowth = null;
              let profitGrowth = null;

              if (index < revenueDates.length - 1) {
                const prevTotalIncome = parseFloat(revenueData["total-income"][index + 1]);
                const prevNetProfit = parseFloat(revenueData["net-profit"][index + 1]);

                revenueGrowth = ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100;
                profitGrowth = ((netProfit - prevNetProfit) / prevNetProfit) * 100;
              }

              return {
                date,
                totalIncome: totalIncome.toFixed(2),
                netProfit: netProfit.toFixed(2),
                interest: interest !== null ? interest.toFixed(2) : null,
                interestEarned: interestEarned !== null ? interestEarned.toFixed(2) : null,
                revenueGrowth: revenueGrowth !== null ? revenueGrowth.toFixed(2) : null,
                profitGrowth: profitGrowth !== null ? profitGrowth.toFixed(2) : null
              };
            });
          } catch (e) {
            console.error('Error parsing JSON data:', e);
            return [];
          }
        } else {
          // Handle table format
          const table = doc.querySelector('table.mctable1');
          if (table) {
            try {
              const headers = Array.from(table.querySelectorAll('thead th')).slice(1, -1).map(th => th.textContent?.trim());
              const rows = table.querySelectorAll('tbody tr');

              const data: any = {};
              rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const key = cells[0].textContent?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') || '';
                const values = Array.from(cells).slice(1, -1).map(cell => {
                  const value = cell.textContent?.trim().replace(/,/g, '') || '0';
                  return value === '-' ? '0' : value;
                });
                data[key] = values;
              });

              return headers.map((date, index) => {
                const totalIncome = parseFloat(data['total-income']?.[index] || '0');
                const netProfit = parseFloat(data['net-profit']?.[index] || '0');
                const interest = data['interest'] ? parseFloat(data['interest'][index] || '0') : null;
                const interestEarned = data['interest-earned'] ? parseFloat(data['interest-earned'][index] || '0') : null;

                let revenueGrowth = null;
                let profitGrowth = null;

                if (index < headers.length - 1) {
                  const prevTotalIncome = parseFloat(data['total-income']?.[index + 1] || '0');
                  const prevNetProfit = parseFloat(data['net-profit']?.[index + 1] || '0');

                  revenueGrowth = ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100;
                  profitGrowth = ((netProfit - prevNetProfit) / prevNetProfit) * 100;
                }

                return {
                  date: date || '',
                  totalIncome: totalIncome.toFixed(2),
                  netProfit: netProfit.toFixed(2),
                  interest: interest !== null ? interest.toFixed(2) : null,
                  interestEarned: interestEarned !== null ? interestEarned.toFixed(2) : null,
                  revenueGrowth: revenueGrowth !== null ? revenueGrowth.toFixed(2) : null,
                  profitGrowth: profitGrowth !== null ? profitGrowth.toFixed(2) : null
                };
              });
            } catch (e) {
              console.error('Error parsing table data:', e);
              return [];
            }
          }
        }
        return [];
      })
    );
  }

  getYearlyBalanceSheetData(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, 'text/html');

        // Try to get data from JSON elements first
        const dataElement = doc.querySelector("#C-12-balance-sheet-graphData") || doc.querySelector("#S-12-balance-sheet-graphData");
        const dateElement = doc.querySelector("#C-12-balance-sheet-graphDate") || doc.querySelector("#S-12-balance-sheet-graphDate");

        if (dataElement && dateElement) {
          // Handle JSON format
          try {
            const balanceSheetData = JSON.parse(dataElement.textContent || '{}');
            const balanceSheetDates = JSON.parse(dateElement.textContent || '[]');

            return balanceSheetDates.map((date: string, index: number) => {
              return {
                date,
                shareCapital: parseFloat(balanceSheetData["share-capital"][index]) || 0,
                reservesAndSurplus: parseFloat(balanceSheetData["reserves-and-surplus"][index]) || 0,
                currentLiabilities: parseFloat(balanceSheetData["current-liabilities"][index]) || 0,
                otherLiabilities: parseFloat(balanceSheetData["other-liabilities"][index]) || 0,
                totalLiabilities: parseFloat(balanceSheetData["total-liabilities"][index]) || 0,
                fixedAssets: parseFloat(balanceSheetData["fixed-assets"][index]) || 0,
                currentAssets: parseFloat(balanceSheetData["current-assets"][index]) || 0,
                otherAssets: parseFloat(balanceSheetData["other-assets"][index]) || 0,
                totalAssets: parseFloat(balanceSheetData["total-assets"][index]) || 0,
                contingentLiabilities: parseFloat(balanceSheetData["contingent-liabilities"][index]) || 0
              };
            });
          } catch (e) {
            console.error('Error parsing balance sheet JSON data:', e);
            return [];
          }
        } else {
          // Handle table format
          const tables = doc.querySelectorAll('table.mctable1');
          if (tables.length > 0) {
            try {
              const headers = Array.from(tables[0].querySelectorAll('thead th')).slice(1, -1).map(th => th.textContent?.trim());
              const data: any = {};

              // Process all tables
              tables.forEach(table => {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                  const cells = row.querySelectorAll('td');
                  const key = cells[0].textContent?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') || '';
                  const values = Array.from(cells).slice(1, -1).map(cell => {
                    const value = cell.textContent?.trim().replace(/,/g, '') || '0';
                    return value === '-' ? '0' : value;
                  });
                  data[key] = values;
                });
              });

              return headers.map((date, index) => {
                return {
                  date: date || '',
                  shareCapital: parseFloat(data['share-capital']?.[index] || '0'),
                  reservesAndSurplus: parseFloat(data['reserves-and-surplus']?.[index] || '0'),
                  currentLiabilities: parseFloat(data['current-liabilities']?.[index] || '0'),
                  otherLiabilities: parseFloat(data['other-liabilities']?.[index] || '0'),
                  totalLiabilities: parseFloat(data['total-liabilities']?.[index] || '0'),
                  fixedAssets: parseFloat(data['fixed-assets']?.[index] || '0'),
                  currentAssets: parseFloat(data['current-assets']?.[index] || '0'),
                  otherAssets: parseFloat(data['other-assets']?.[index] || '0'),
                  totalAssets: parseFloat(data['total-assets']?.[index] || '0'),
                  contingentLiabilities: parseFloat(data['contingent-liabilities']?.[index] || '0')
                };
              });
            } catch (e) {
              console.error('Error parsing balance sheet table data:', e);
              return [];
            }
          }
        }
        return [];
      })
    );
  }

  getCashFlowData(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, 'text/html');

        // Try JSON format first
        const dataElement = doc.querySelector("#C-12-cash-flow-graphData") || doc.querySelector("#S-12-cash-flow-graphData");
        const dateElement = doc.querySelector("#C-12-cash-flow-graphDate") || doc.querySelector("#S-12-cash-flow-graphDate");

        if (dataElement && dateElement) {
          try {
            const cashFlowData = JSON.parse(dataElement.textContent || '{}');
            const cashFlowDates = JSON.parse(dateElement.textContent || '[]');

            return cashFlowDates.map((date: string, index: number) => ({
              date,
              operatingActivities: parseFloat(cashFlowData["operating-activities"][index]) || 0,
              investingActivities: parseFloat(cashFlowData["investing-activities"][index]) || 0,
              financingActivities: parseFloat(cashFlowData["financing-activities"][index]) || 0,
              otherCashFlow: parseFloat(cashFlowData["others"][index]) || 0,
              netCashFlow: parseFloat(cashFlowData["net-cash-flow"][index]) || 0
            }));
          } catch (e) {
            console.error('Error parsing cash flow JSON data:', e);
            return [];
          }
        } else {
          // Handle table format
          const table = doc.querySelector('table.mctable1');
          if (table) {
            try {
              const headers = Array.from(table.querySelectorAll('thead th')).slice(1, -1).map(th => th.textContent?.trim());
              const rows = table.querySelectorAll('tbody tr');

              const data: any = {};
              rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const key = cells[0].textContent?.trim().toLowerCase().replace(/\s+/g, '-').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '') || '';
                const values = Array.from(cells).slice(1, -1).map(cell => {
                  const value = cell.textContent?.trim().replace(/,/g, '') || '0';
                  return value === '-' ? '0' : value;
                });
                data[key] = values;
              });

              return headers.map((date, index) => ({
                date: date || '',
                operatingActivities: parseFloat(data['operating-activities']?.[index] || '0'),
                investingActivities: parseFloat(data['investing-activities']?.[index] || '0'),
                financingActivities: parseFloat(data['financing-activities']?.[index] || '0'),
                otherCashFlow: parseFloat(data['others']?.[index] || '0'),
                netCashFlow: parseFloat(data['net-cash-flow']?.[index] || '0')
              }));
            } catch (e) {
              console.error('Error parsing cash flow table data:', e);
              return [];
            }
          }
        }
        return [];
      })
    );
  }

  getQuarterlyRevenue(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(res => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(res, 'text/html');

        const dataElement = doc.querySelector("#C-3-income-graphData");
        const dateElement = doc.querySelector("#C-3-income-graphDate");

        if (dataElement && dateElement) {
          const revenueData = JSON.parse(dataElement.textContent || '{}');
          const revenueDates = JSON.parse(dateElement.textContent || '[]');

          return revenueDates.map((date: string, index: number) => {
            const totalIncome = parseFloat(revenueData["total-income"][index]);
            const netProfit = parseFloat(revenueData["net-profit"][index]);

            let revenueGrowth = null;
            let profitGrowth = null;

            if (index < revenueDates.length - 1) {
              const prevTotalIncome = parseFloat(revenueData["total-income"][index + 1]);
              const prevNetProfit = parseFloat(revenueData["net-profit"][index + 1]);

              revenueGrowth = ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100;
              profitGrowth = ((netProfit - prevNetProfit) / prevNetProfit) * 100;
            }

            return {
              date,
              totalIncome: totalIncome.toFixed(2),
              netProfit: netProfit.toFixed(2),
              revenueGrowth: revenueGrowth !== null ? revenueGrowth.toFixed(2) : null,
              profitGrowth: profitGrowth !== null ? profitGrowth.toFixed(2) : null
            };
          });
        } else {
          return [];
        }
      })
    );
  }

  formatIndianCurrency(amount: number): string {
    return amount ? new Intl.NumberFormat('en-IN').format(amount) : '0';
  }

  changeQY() {
    this.frequency = this.frequency === "Yearly" ? "Quarterly" : "Yearly";
  }
}
