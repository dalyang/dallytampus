/* Default content for Dally's portfolio template.
   Everything here can be changed from the admin (Edit page). Once you click
   "Save & publish", the saved version in Supabase is used instead of this file. */
(function(){
const img=id=>({id,kind:'image'});
const E=()=>({id:'',kind:''});
const reel=(type,cap,m)=>Object.assign(m||E(),{type,cap});
const car=(pillar,cap,n)=>({pillar,cap,slides:Array.from({length:n||3},E)});

const INTRO="Here's what it looks like working with me as your Social Media Manager.";

/* Real Estate & Property Management: the fully set-up example industry */
const realEstate={
  key:'real-estate',name:'Real Estate & Property Management',status:'client',
  intro:INTRO,
  lede:'Client results: 8 months running Instagram, Facebook and TikTok for a Charleston, SC brokerage and property management company. The reels are real work; the carousels and link page further down are samples of my approach.',
  blocks:[
    {kind:'reels',preview:true,label:'Reels',title:'Listing reels, *edited and posted*',sub:'Real reels I edited and posted for a Charleston, SC real estate brokerage and property management company (name kept private). Footage is a mix of their own clips, Pexels stock and AI visuals, shown with permission.',
     items:[
      reel('Lifestyle','Charleston lifestyle reel: selling the area, not just the house.',{id:'re-1.mp4#t=13.0',kind:'video',poster:'re-1.jpg'}),
      reel('Listing','Price drop listing reel: the new price, the best features and one clear next step.',{id:'re-2.mp4#t=1.8',kind:'video',poster:'re-2.jpg'}),
      reel('Rentals','Rental reel with a comment keyword, so renters get the details by DM.',{id:'re-3.mp4#t=7.0',kind:'video',poster:'re-3.jpg'}),
      reel('Rentals','New rental "coming soon" teaser.',{id:'re-4.mp4#t=2.6',kind:'video',poster:'re-4.jpg'}),
      reel('Walkthrough','Listing walkthrough from curb appeal to kitchen and bath. The footage tells the story, no text needed.',{id:'re-5.mp4#t=8.4',kind:'video',poster:'re-5.jpg'})
     ]},
    {hidden:true,kind:'carousels',label:'Carousels',title:'Carousels people *save and send*',sub:'Each one solves one problem from start to finish, so it gets saved, sent to a partner and brought up on the first call.',
     items:[
      car('Buyers','A builder is offering a 4.9% rate? Swipe to see year 3, and the price you are really paying for it',5),
      car('Sellers','Price cut or seller credit? What buyers here are actually asking for right now, with real numbers',5),
      car('Renters','Rentals near you with a free month or waived fees, and the exact message to ask for one',4),
      car('Owners & landlords','Rent it or sell it? One page that runs your real numbers: rent, fees, repairs, vacancy and sale price',5),
      car('Listings','Just listed, priced for this market: the monthly payment at today’s rate, with the seller’s credit applied',4)
     ]},
    {kind:'feed',preview:true,label:'Your feed',title:'How your feed *will look*',sub:'A profile that tells people who you help in two seconds, and a link that keeps every lead.',
     profile:{shot:img('re-profile.jpg'),shotcap:'Concept profile set up the way top agents do it. Scroll inside the phone.',avatar:E(),handle:'yourname.realty',name:'Your Name · Realtor & Property Manager',bio:'Rent it, manage it, buy it or sell it in [your city]\nFree rent estimate & home value below',link:'yourlink.com/start',linkTag:'Lead magnet',posts:'84',followers:'2,310',following:'402'},
     linkNote:'Your bio link is a lead magnet, so your leads will not be lost. One page asks what they need, owner, renter, seller or buyer, and gives each one a short form. You get every inquiry with the details already filled in.',
     points:['Name line that says what you do and where: “Austin Realtor & Property Manager”','Every post answers one real problem and ends with a comment keyword (WAIT, PRICE, SAFE, RENT) that sends the answer by DM','A four-line bio: who you help, proof, what to expect, and your free offer','Three pinned posts: who you help, a real result, and your free home value','Highlights for Start here, Buyers, Sellers, Rentals and Reviews','A steady mix of listings, local life, tips, reviews and you on camera'],
     posts:Array.from({length:9},E),
     lp:{shot:E(),logo:E(),url:'start.html',
       cap:'This is what your link in bio looks like. Every visitor picks the path that fits them, so each inquiry reaches you with the details you need to follow up.',
       eyebrow:'Sample · Real estate & property management · Austin, TX',title:'Hi, I’m Jordan. Where are you in your move?',
       sub:'Owning, renting, selling or buying. Tap the one that fits and I’ll take it from there, usually the same day.',
       chips:['Austin local','Free home value','Replies within a day'],
       ask:'What brings you here today?',
       paths:[
        {badge:'Free rent estimate',t:'I own a rental',d:'Find out what it could rent for. Free, and no pressure to sign anything.',icon:'key',
         form:{title:'Let’s price your rental',fields:['Property address','Bedrooms and bathrooms','Your name','Email or phone'],btn:'Send my free estimate',done:'Thank you! I’ll look at what similar homes nearby rent for and get back to you within a day.'}},
        {badge:'',t:'I’m looking for a place to rent',d:'See what’s open now and book a showing that suits your schedule.',icon:'home',
         form:{title:'Tell me what you need',fields:['Move-in date','Monthly budget','Bedrooms','Your name','Email or phone'],btn:'Show me what’s available',done:'Got it! I’ll send you the places that match, and we can book a showing from there.'}},
        {badge:'Free home value',t:'I’m thinking of selling',d:'Get an honest number from someone who knows your street.',icon:'tag',
         form:{title:'What’s your home worth?',fields:['Property address','When you’re hoping to sell','Your name','Email or phone'],btn:'Get my home value',done:'Thank you! I’ll pull recent sales on your street and walk you through the number.'}},
        {badge:'',t:'I want to buy',d:'Tell me what matters to you. I’ll send homes that fit, not a flood of listings.',icon:'search',
         form:{title:'Let’s find your place',fields:['Areas you like','Budget','Must-haves','Your name','Email or phone'],btn:'Send me homes that fit',done:'Perfect. I’ll start a short list and check in before I send anything.'}}
       ],
       btn1:'Call me',btn2:'Text me',contact:'(512) 555-0134 · Downtown Austin',
       colors:{}}},
    {hidden:true,kind:'ai',label:'AI content',title:'AI content, *used with care*',
     note:"AI helps on the weeks you can't film, or when a room needs to look its best: listing reels made from your photos, virtual staging, twilight shots and decluttering. But real estate runs on trust, so you'll still show up in easy content like short talking videos, local spots and quick tips. I make filming simple, and AI visuals are always labeled.",
     items:[
      {fmt:'reel',type:'AI listing reel',cap:'A walkthrough reel built from your listing photos',id:'',kind:''},
      {fmt:'reel',type:'AI property tour',cap:'Still photos turned into a smooth video tour',id:'',kind:''},
      {fmt:'photo',type:'Staging · before',cap:'Empty living room',id:'',kind:''},
      {fmt:'photo',type:'Staging · after',cap:'Same room, virtually staged',id:'',kind:''},
      {fmt:'photo',type:'Day to dusk',cap:'Daytime exterior turned into a twilight shot',id:'',kind:''},
      {fmt:'photo',type:'Decluttering',cap:'Clutter removed so buyers see the space',id:'',kind:''},
      {fmt:'photo',type:'Renovation preview',cap:'What this kitchen could look like after an update',id:'',kind:''}
     ]},
    {kind:'film',label:'How to film this',title:'I guide you *from zero* on camera',sub:"Never filmed a reel? Good. Pick the kind of help that fits your schedule. Either way, you know what to say, what to film and which angles to use before you press record.",ways:[{t:'Shot list & angles',d:'Before each shoot I send your script, a shot list and simple angle guides. You film on your own time.'},{t:'Guide videos',d:'Short sample videos I record to show each shot, so you can copy the framing, movement and timing.'}],
     guides:[{reel:E(),title:'“What would this home really cost you a month?” reel',hook:'“This home is $585K. Here’s what it actually costs you a month, before anyone tells you.”',
       script:'Hook outside the home (3 seconds). Walk in while the numbers pop up on screen: the mortgage at today’s rate, then taxes and insurance, then HOA. Show the seller’s credit bringing it down. End on camera: “Want this done for a home you’re looking at? Comment PAYMENT and I’ll send it.”',
       shots:['You outside the home, saying the hook to camera','Slow walk through the front door','The one feature that justifies the price (kitchen, yard, view)','You at the counter pointing at your phone (numbers added in editing)','You on camera saying the comment keyword'],
       setup:[{k:'Close-up',d:'Details and textures, phone 30 cm away'},{k:'Overhead',d:'Countertops and floor plans, phone flat above'},{k:'Eye level',d:'When you talk to camera, lens at your eyes'},{k:'Light',d:'Face the window. Film before 10 am or after 4 pm'},{k:'Phone placement',d:'Vertical, on a small tripod at chest height'}]}]}
  ]
};

/* Fashion & Jewelry: real client work (Miss Amazing Pearl) */
const fashion={
  key:'fashion-jewelry',name:'Fashion & Jewelry',status:'client',
  intro:INTRO,
  lede:'Client results: Miss Amazing Pearl, a pearl jewelry brand in Perth, Western Australia. Organic Facebook content only, no ad budget.',
  blocks:[
    {kind:'reels',preview:true,label:'Reels',title:'Filmed, modeled *and edited*',sub:'Product, brand and promo reels for women 35+ in Australia.',
     items:[reel('Product','Product reel',{id:'pearl-1.mp4#t=5.5',kind:'video',poster:'pearl-1.jpg'}),reel('Brand','Brand reel',{id:'pearl-2.mp4#t=5.7',kind:'video',poster:'pearl-2.jpg'}),reel('Promo','Promo reel',{id:'pearl-3.mp4#t=2.4',kind:'video',poster:'pearl-3.jpg'}),reel('Model & styling','Filmed, modeled and edited',{id:'pearl-4.mp4#t=7.7',kind:'video',poster:'pearl-4.jpg'})]},
    {kind:'gallery',preview:true,label:'Graphics',title:'Posters, posts *and launches*',sub:'Made from strategy, not templates. Product launches, reviews, promos and “necklace of the month” moments.',shape:'auto',
     items:['p2','p7','p3','p10','p12','p4','p5','p1','g1','g3','g4','g5','g6','g9','g10','g11','g12','g13','g14','g16','g17','g18','g19','p6','p8','p9','p11','p13'].map(n=>Object.assign(img('ma-'+n+'.jpg'),{label:''}))},
    {kind:'gallery',preview:true,label:'Campaign',title:'One message, *five posts*',sub:'A pearl campaign planned as a series: timeless, polished, modern, everyday, evolved. Each post works alone and looks even better side by side on the feed.',shape:'auto',
     items:[1,2,3,4,5].map(n=>Object.assign(img('ma-c'+n+'.jpg'),{label:''}))},
    {kind:'gallery',label:'AI visuals',title:'AI-assisted, *human taste*',sub:'Product visuals made with Google AI Studio and Canva, then polished until they were on-brand. Labeled as AI-assisted.',shape:'auto',
     items:Array.from({length:10},(_,i)=>Object.assign(img('ma-ai'+(i+1)+'.jpg'),{label:''}))},
    {kind:'proof',label:'Client results',title:'What we *achieved*',sub:'I managed the page, ran the photo and video shoots, edited every reel, created AI-assisted visuals and answered every customer inquiry.',
     media:E(),
     stats:[{v:'47.9K',l:'views on Facebook'},{v:'+978.9%',l:'content interactions'},{v:'$0',l:'ad spend, organic only'}],
     callout:'And the best part: first sales, from organic content alone.'}
  ]
};

/* Industries in progress: same structure, empty until Dally builds each campaign */
function soon(key,name,types,pillars,aiNote,lede){
  return {key,name,status:'soon',intro:INTRO,lede,
    blocks:[
      {kind:'reels',preview:true,label:'Reels',title:'Reels for *'+name.toLowerCase()+'*',sub:'',items:types.map(t=>reel(t,''))},
      {kind:'carousels',label:'Carousels',title:'Carousels by *content pillar*',sub:'',items:pillars.map(p=>car(p,''))},
      {kind:'feed',preview:true,label:'Your feed',title:'How your feed *will look*',sub:'',profile:{avatar:E(),handle:'yourbrand',name:'Your Brand',bio:'Who you help, in one line\nYour free offer below',link:'yourlink.com/free-guide',linkTag:'Lead magnet',posts:'0',followers:'0',following:'0'},linkNote:'Your bio link is a lead magnet, so your leads will not be lost.',points:[],posts:Array.from({length:9},E)},
      {kind:'ai',label:'AI content',title:'Where AI *fits*',note:aiNote,items:[{fmt:'reel',type:'AI reel',cap:'',id:'',kind:''},{fmt:'photo',type:'AI photo',cap:'',id:'',kind:''},{fmt:'photo',type:'AI photo',cap:'',id:'',kind:''}]},
      {kind:'film',label:'How to film this',title:'I guide you *from zero* on camera',sub:'',ways:[{t:'Shot list & angles',d:'Before each shoot I send your script, a shot list and simple angle guides. You film on your own time.'},{t:'Guide videos',d:'Short sample videos I record to show each shot, so you can copy the framing, movement and timing.'}],guides:[{reel:E(),title:'Your first reel',hook:'Add the hook',script:'Add a short script',shots:['Shot 1','Shot 2','Shot 3'],setup:[{k:'Close-up',d:''},{k:'Overhead',d:''},{k:'Eye level',d:''},{k:'Light',d:''},{k:'Phone placement',d:''}]}]}
    ]};
}
const hide=x=>Object.assign(x,{hidden:true});
const V=(id,t)=>({id:id+'.mp4#t='+t,kind:'video',poster:id+'.jpg'});

/* E-commerce: real TikTok affiliate videos from Dally's own account */
const ecommerce={
  key:'e-commerce',name:'E-commerce',status:'own',
  intro:INTRO,
  lede:'Product videos I filmed, starred in and edited for my own TikTok affiliate account: beauty, fashion and gadgets. The same skills I use to make your products look good and easy to buy.',
  blocks:[
    {kind:'reels',preview:true,label:'Product videos',title:'Filmed, styled *and edited*',sub:'Real posts from my own TikTok. A clear hook, the product in action and a reason to buy.',
     items:[
      reel('Beauty deal','Buy 1 take 1 matte lip tint: try-on and the deal in one video.',V('tiktok-1',13.2)),
      reel('Fashion','Outfit ideas: the full look, styled and shown from every angle.',V('tiktok-2',0.9)),
      reel('Gadget','A budget selfie light, shown working in real light.',V('tiktok-3',27.9)),
      reel('Fashion try-on','Halter top try-on with real size details buyers ask for.',V('tiktok-4',2.0))
     ]}
  ]
};

const industries=[
  realEstate,
  fashion,
  ecommerce,
  hide(soon('pilates','Pilates studio',['Class teaser','Educational','Behind the scenes','Trend / Humor'],['Educational','Classes & offers','Community'],'Notes on where AI helps for studios go here.','A campaign for boutique Pilates studios is coming soon.')),
  hide(soon('nail-studio','Nail studio',['Before & after','Process','Educational','Trend / Humor'],['Nail art','Care tips','Offers'],'Notes on where AI helps for nail studios go here.','A campaign for nail studios is coming soon.')),
  hide(soon('tech-ai','Tech & AI',['Product demo','Explainer','Founder story','Trend / Humor'],['Education','Product','Behind the build'],'Notes on where AI helps for tech brands go here.','A campaign for tech and AI brands is coming soon.'))
];

window.DEFAULT_STATE={
  v:2,
  theme:{preset:'merlot',font:'fraunces',colors:{paper:'#F7F2EB',stone:'#EEE7DE',cover:'#EAE2D8',ink:'#211417',muted:'#75666A',wine:'#7A2337',merlot:'#3A1220',sand:'#CBB79A'}},
  site:{
    brand:'Dally',brandEm:'Tampus',
    book:'https://docs.google.com/forms/d/e/1FAIpQLSdfgh48hf5YaFG3swcbRvCBdPRD_6QPkxwNd_zwkfLE4HbmLw/viewform',email:'',instagram:'https://www.instagram.com/dallytampus/',facebook:'https://www.facebook.com/dallytampus',linkedin:'https://www.linkedin.com/in/dallytampus',tiktok:'',
    navCta:'Book a call',
    footer:'Social media management for small businesses and growing brands. From post to paying customer.'
  },
  sections:[
    {type:'hero',id:'top',nav:'',
     eyebrow:'Social Media Manager · for small businesses and growing brands',name:'Dally',nameEm:'Tampus',
     intro:'*From post to paying customer.* I make your content, handle your comments and messages, and follow up every inquiry, so your posts turn into real customers. You send the photos and clips and approve. I manage the rest.',
     btn1:'View my work',btn2:'Book a call with me',photo:img('dally-cutout.png'),
     line:'New campaign for a different industry every week'},
    {type:'about',id:'about',nav:'About',title:'About *me*',flip:false,
     paras:[
      "I'm Dally, a Social Media Manager for small businesses and growing brands, from real estate teams to studios and online shops. My goal is simple: you'll always know what to post, what to say and why it works.",
      'I think like a strategist first. Before anything gets filmed, I study your market, your competitors and what your buyers actually search for. Then I build a calendar around it.',
      "Most owners don't need more ideas. They need someone to guide them on camera. I write your hooks and scripts, then guide you step by step with a shot list, simple angles and short guide videos you can copy.",
      'Every week I build a campaign for a different industry, so you can see exactly what working with me looks like for a brand like yours.'
     ],
     signoff:'Excited to build yours, *Dally*',
     photo:img('dally-about.jpg'),
     stats:[{v:'Scripts & shot lists',l:'written for you before every shoot'},{v:'Phone-only filming',l:'shot lists and guide videos you can copy'},{v:'Strategy first',l:'research before anything gets filmed'}]},
    {type:'latest',id:'latest',nav:'Latest',title:'Latest *work*',
     items:[
      Object.assign({id:'pearl-2.mp4#t=5.7',kind:'video',poster:'pearl-2.jpg'},{label:'Miss Amazing Pearl',cap:'Brand reel',tag:'Client work'}),
      Object.assign({id:'pearl-1.mp4#t=5.5',kind:'video',poster:'pearl-1.jpg'},{label:'Miss Amazing Pearl',cap:'Product reel',tag:'Client work'}),
      Object.assign({id:'pearl-3.mp4#t=2.4',kind:'video',poster:'pearl-3.jpg'},{label:'Miss Amazing Pearl',cap:'Promo reel',tag:'Client work'}),
      Object.assign({id:'pearl-4.mp4#t=7.7',kind:'video',poster:'pearl-4.jpg'},{label:'Miss Amazing Pearl',cap:'Filmed, modeled & edited',tag:'Client work'})
     ]},
    {type:'industries',id:'work',nav:'Industries',title:'Work by *industry*',
     sub:'Pick your industry and picture your own brand on the feed. Client results are real work for real clients. My own work is real content from my own accounts and campaigns. Concept campaigns are samples that show my approach.',
     industries},
    {type:'services',id:'services',nav:'Services',title:'My *services*',
     items:[
      {t:'Social media strategy',d:'Market research, content pillars and a monthly calendar built around how your buyers actually scroll.',tag:''},
      {t:'Content creation',d:'I make all your post content: carousels, graphics, stories and captions, designed from strategy, not templates.',tag:''},
      {t:'Reels & video editing',d:'Hooks, captions, pacing and trending audio, edited to stop the scroll.',tag:''},
      {t:'AI visuals',d:'AI-assisted visuals only where they genuinely help, like virtual staging or product scenes. Always on-brand.',tag:''},
      {t:'Posting & engagement handling',d:'I post and schedule everything, reply to comments and messages, and engage with your community every week. You never have to log in.',tag:''},
      {t:'Lead capture & follow-up',d:'A bio link with a door for every kind of customer, comment keywords that start conversations, and quick replies to every inquiry during US business hours, all logged so no lead slips away.',tag:'New'},
      {t:'Email newsletters',d:'Written, designed and sent for you, so past customers come back and new ones stay warm.',tag:''},
      {t:'Ad-ready content',d:'Ad creative only: I make the videos and graphics for your ads from posts that already perform. You or your ads team run the campaigns.',tag:''},
      {t:'Filming guidance',d:'Before every shoot you get your script, a shot list with simple angles and short guide videos to copy. Film on your own time. Phone only, no studio needed.',tag:'New'}
     ]},
    {type:'process',id:'process',nav:'How I work',title:'The *Post-to-Customer* System',
     items:[
      {t:'Discovery call',d:'A free 20-minute call about your brand, your goals and who you want to reach.'},
      {t:'Plan',d:'We agree on platforms, posting rhythm and what success looks like.'},
      {t:'Market research',d:'Your competitors, your audience and what is already working in your industry.'},
      {t:'Strategy & content calendar',d:'Content pillars, hooks and a month of posts mapped out before anything is filmed.'},
      {t:'You send, I create',d:'Send me your photos and short phone clips. I tell you exactly what to film (script, shot list and guide videos), then I create everything.'},
      {t:'Editing & scheduling',d:'I edit your footage, design the posts and schedule everything.'},
      {t:'Post & capture',d:'I post and schedule everything. Every post ends with one clear next step: a keyword, a message or a link with a door for each kind of customer.'},
      {t:'Reply & follow up',d:'I answer inquiries during US business hours and log every lead, so nobody who reaches out is forgotten.'},
      {t:'Report',d:'Each month you see what brought inquiries and sales, what worked, and what we do next.'}
     ]},
    {type:'results',id:'results',nav:'Results',title:'Real *results*',sub:'Real numbers from real client pages. No ads, just content.',
     items:[
      {v:'47.9K',l:'views on Facebook',src:'Miss Amazing Pearl · Fashion & Jewelry'},
      {v:'+978.9%',l:'content interactions',src:'Miss Amazing Pearl · organic only'},
      {v:'27 → 122',l:'content interactions in my first two months',src:'Real estate & property management'},
      {v:'+351.9%',l:'content interactions',src:'Real estate & property management'}
     ],
     proof:E()},
    {type:'clients',id:'clients',nav:'Clients',title:"Clients I've *worked with*",
     items:[
      {name:'Miss Amazing Pearl',ind:'Fashion & Jewelry · Perth, Australia',logo:E()},
      {name:'Real estate & property management team',ind:'Charleston, SC · name kept private',logo:E()},
      {name:'Your brand',ind:'Could be next',logo:E()}
     ]},
    {type:'contact',id:'contact',nav:'Contact',title:"Let's work *together*",
     text:"Tell me about your brand. I'll come back with a plan for your feed and what we'd film first. Not ready for a call? DM me AUDIT on Instagram for a free profile audit.",
     cards:[{k:'book',t:'Book a call with me',d:'Pick a time that suits you · 20 minutes'},{k:'email',t:'Email',d:''},{k:'instagram',t:'Instagram',d:'DM me AUDIT for a free profile audit'},{k:'facebook',t:'Facebook',d:''},{k:'linkedin',t:'LinkedIn',d:''}]}
  ]
};
})();
