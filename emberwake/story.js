// Emberwake story, rewritten in layer five. These scenes replace the older ones with the same key.
// A line is [speaker, text] or [speaker, text, condition]. Conditions: 'has:id', '!has:id', 'flag:x', '!flag:x'.
// Lines spoken by a hero listed in S.flags.gone are skipped automatically.
(function (root) {
'use strict';

const STORY5 = {
  intro: [
    ['', 'Ashby burned three nights ago. The Hollow came out of the north with no banners and no faces, and by morning the village was ash.'],
    ['', 'Three got out. Bram, the smith\'s son. Wren, who poached the lord\'s deer for years and never got caught. Isolde, apprentice to old Magister Hale, who never finished her training.'],
    ['bram', 'Mam was in the forge when the roof came in. I heard her shout. Then I didn\'t.'],
    ['wren', 'Bram...'],
    ['bram', 'Don\'t. Not yet.'],
    ['isolde', 'They were looking for me. For this.'],
    ['', 'She opens her hand. A stone the size of a hen\'s egg, glowing like a coal that will not go out.'],
    ['isolde', 'Master Hale pressed it into my hands and pushed me out of the window. His last words were, "Don\'t let it go out, and don\'t let him have it."'],
    ['wren', 'Him who?'],
    ['isolde', 'He didn\'t say.'],
    ['wren', '...Right. Course he didn\'t.'],
    ['', 'Wren turns away quickly, as if she has something in her eye.'],
    ['bram', 'The keep on the hill. Emberwake. It\'s got walls, mostly. We start there.'],
  ],
  camp_thorn: [
    ['wren', 'Can I ask you both something? Hypothetically.'],
    ['bram', 'Go on.'],
    ['wren', 'If somebody did something stupid. For money. Before they knew what it would cost. Would that make them as bad as the people who did the burning?'],
    ['isolde', 'That depends what they do next, I think.'],
    ['wren', '...Yeah. Hypothetically.'],
    ['bram', 'You\'re being strange, Wren.'],
    ['wren', 'I\'m always strange. Go to sleep.'],
  ],
  thornwood_out: [
    ['', 'Bram pulls a black arrow out of Old Tusk\'s hide. The shaft is cold to the touch.'],
    ['bram', 'Hollow make. Someone drove him at the farms.'],
    ['', 'On the ridge above the clearing stands a tall figure in black iron, quite still, watching.'],
    ['isolde', 'Bram. The ridge.'],
    ['', 'The figure lifts one hand, almost politely, then steps back into the trees and is gone.'],
    ['wren', 'I hate that. I hate that a lot.'],
    ['isolde', 'The stone went cold when it looked at me. Like a hand closing round it.'],
    ['bram', 'The arrow came from the Mill Road. If the Hollow are using it, the bandits will know who\'s paying.'],
  ],
  millroad_boss: [
    ['', 'A red coated man sits on an overturned cart. Beside him, a chest of Hollow silver stands open.'],
    ['', '"The ember bearer, in the flesh. The Warden pays well for you, girl. He paid well for the first word of you, too."'],
    ['', 'Rook smiles at Wren.'],
    ['', '"Hello again, poacher. Come to collect the rest of your fee?"'],
    ['wren', 'Shut up. Shut your mouth.'],
    ['bram', 'Wren?'],
  ],
  millroad_out: [
    ['', 'Rook goes down hard in the mud. He laughs through broken teeth as Bram hauls him up by the collar.'],
    ['', '"Ask her. Go on. Who do you think told me old Hale kept a warm stone in his study? Who do you think I sold the news on to?"'],
    ['', 'Rook twists free and runs for the trees. Nobody follows him. Everyone is looking at Wren.'],
    ['wren', 'I owed him forty silver. He said he only wanted to know what Hale kept in his tower. Something to sell. I didn\'t know. I swear on my mam\'s grave, I didn\'t know they\'d burn Ashby.'],
    ['isolde', 'My master is dead because you needed forty silver.'],
    ['wren', 'I know. I\'ve known since the first night. I\'ve been waiting for one of you to work it out.'],
    ['bram', 'Isolde. It\'s your stone and your master. It\'s your call.'],
  ],
  wren_forgiven: [
    ['isolde', 'You stayed. Every fight since Ashby, you stayed when you could have run. That has to count for something.'],
    ['wren', 'I won\'t waste it. I swear I won\'t.'],
    ['bram', 'Good. Now somebody cut that trader loose before he chews through the rope.'],
  ],
  wren_banished: [
    ['isolde', 'Go. I can\'t look at you.'],
    ['wren', '...Look after her, Bram.'],
    ['', 'Wren walks into the trees with her bow over her shoulder and doesn\'t look back. Bram watches the place where she went for a long time.'],
    ['bram', 'Somebody cut that trader loose.'],
  ],
  hob_rescue: [
    ['', 'Behind the carts a trader is tied to a wheel. Hob, round and red faced and very glad to see you.'],
    ['', '"Bless you all. I\'ll set up at your keep, if you\'ll have me. Proper stock, better blades. Better prices for friends."'],
    ['', '"And listen. The Hollow came down from the tower beyond Fenmire. They pass through the Barrow Hills, and the dead have been walking ever since."'],
  ],
  raid_warn: [
    ['', 'That night carts come up the hill to Emberwake. Families who hid in the woods. A miller and his sons. Two of Rook\'s men who\'d had enough of him.'],
    ['', 'And at the back, wrapped in a horse blanket with her arm in a sling, a big grey haired woman with a smith\'s shoulders.'],
    ['bram', 'Mam?'],
    ['', '"Took you long enough to find a roof, lad."'],
    ['', 'Bram doesn\'t say anything at all. He just holds on to her, and keeps holding on.'],
    ['isolde', 'Rook got away. He\'ll tell the Hollow exactly where we are.'],
    ['bram', 'Then we\'ll have walls, and people on them. We\'ve got something worth defending now.'],
    ['', 'DEFEND EMBERWAKE unlocked. When night falls the Hollow will come. Put archers on the walls, soldiers at the gate and your heroes where they\'re needed most.'],
    ['', 'The road east to Brightwater market is open too. They say its arena pays well.'],
  ],
  dream_1: [
    ['', 'That night Isolde dreams of a cold so deep it has a voice.'],
    ['', '"Little spark. You carry a piece of me. I would like it back. I can be very patient. And then I can be very quick."'],
    ['isolde', 'Who are you?'],
    ['', '"Ask your master."'],
    ['', 'She wakes with frost in her hair.'],
  ],
  barrows_out: [
    ['', 'The Shade comes apart into cold ash. Among the grave goods lies a leather notebook, far newer than anything else in the barrow.'],
    ['isolde', 'This is Master Hale\'s writing.'],
    ['isolde', '"Day forty. The ember\'s hunger grows. I hear him in it now, the old king under the north ice. He says the hunger will stop if I bring the ember to him."'],
    ['isolde', 'The pages after that are torn out.'],
    ['bram', 'He was here? When?'],
    ['isolde', 'The ink is fresh. That can\'t be right. He\'s dead.'],
    ['', 'Hale\'s journal: one page found. More of it may be out there, in places only the right people can reach.'],
  ],
  the_raid: [
    ['', 'You see the smoke from three miles off.'],
    ['', 'Emberwake\'s gate hangs open. The Hollow are in the yard, and at their head stands a knight in iron so black it drinks the torchlight.'],
    ['bram', 'MAM!'],
    ['', '"Morvane\'s Hand greets the ember bearer. The Warden sends his regards, and asks for his property back."'],
  ],
  raid_after: [
    ['', 'The Hand falls and the Hollow scatter into the dark. In the grey light, the cost becomes clear.'],
    ['', 'Hob lies by his stall with his account book still in his hand. He held the door of the hall long enough for the children to get inside.'],
    ['', 'Maud is gone. Dragged away north, the miller says. Alive, and fighting every step.'],
    ['bram', 'I\'ll get her back. I\'ll take that tower apart stone by stone.'],
    ['', 'Hob\'s daughter Tilly takes over the stall. "He\'d want it open. He always said trade is how you tell people you\'re still here."'],
    ['isolde', 'There\'s a letter. Pinned to the hall door with a black arrow.'],
    ['isolde', '"Little ember. Come to the tower and bring the stone, and the smith\'s mother lives. You have my word. You used to trust my word. H."'],
    ['isolde', '...H.'],
  ],
  dream_2: [
    ['', 'Isolde dreams again. A hall of black ice. A throne. Something enormous breathing on the other side of the dark.'],
    ['', '"He has told you nothing. He was always a coward with the truth. Come north when you are tired of being lied to."'],
    ['wren', 'Isolde. Isolde! You were talking in your sleep. Your lips are blue.', 'has:wren'],
    ['bram', 'Isolde, wake up. You were talking in your sleep. Your lips are blue.', '!has:wren'],
  ],
  camp_wren: [
    ['wren', 'I keep waiting for you to throw it back at me.'],
    ['isolde', 'I might. One day. Not today.'],
    ['wren', 'That\'s fair. That\'s more than fair.'],
    ['bram', 'Wren. Mam always liked you. Said you were the only one in Ashby who could out-swear her.'],
    ['wren', 'She\'ll get the chance again. We\'re getting her back.'],
  ],
  fenmire_out: [
    ['', 'The knight sinks to his knees in the black water. The hate drains out of his eyes.'],
    ['', '"Emberwake... I was its captain. Hale was my friend. A scholar. He came to the fen looking for a way to quiet the ember\'s hunger."'],
    ['', '"He found the old king\'s voice instead. It made him the Warden. It made me this."'],
    ['isolde', 'No. He died. He pushed me out of the window, he...'],
    ['', '"He wears a ring. A candle in a circle. Look for it when you face him."'],
    ['isolde', 'He gave me the window and kept the fire. He let them burn Ashby to get the stone back.'],
    ['bram', 'Isolde.'],
    ['isolde', 'I\'m all right. I\'m not. I will be.'],
    ['', 'The knight gives you his plate and goes still. Beyond the causeway, the Hollow Tower waits.'],
  ],
  tower_in: [
    ['', 'The tower doors stand open, as if you are expected.'],
    ['isolde', 'He knows I\'m coming. He knows I can\'t not come.'],
    ['bram', 'Mam\'s in there. Whatever he is now, he doesn\'t get to keep her.'],
    ['wren', 'For the record, I hate this. Also, I\'m with you. Both of those.', 'has:wren'],
  ],
  wren_hollow: [
    ['', 'On the upper stair, an archer is waiting. Black iron has grown over her arms like ivy. Her eyes are empty.'],
    ['bram', 'Wren?'],
    ['', '"She came to the tower to bargain for the smith\'s mother," says a voice from the dark above. "Herself, in exchange. I accepted the first half of the offer."'],
    ['isolde', 'Wren, it\'s us. It\'s us.'],
    ['', 'Wren draws her bow.'],
  ],
  wren_saved: [
    ['', 'Wren falls to her knees. The black iron is still spreading.'],
    ['morwen', 'Hold her. Both of you. Don\'t let go whatever she does.'],
    ['', 'Morwen presses her palms to the iron and pulls, the way you\'d pull a splinter. Something black and screaming comes out of Wren and drowns in the witch\'s hands.'],
    ['wren', '...Isolde? I came to trade myself for Maud. It was the only useful thing I could think of.'],
    ['isolde', 'You absolute idiot. Come here.'],
    ['', 'Wren rejoins the party.'],
  ],
  wren_dies: [
    ['', 'Wren falls. The iron cracks away from her face and, for a moment, she is only Wren.'],
    ['wren', 'Came to swap myself for Maud. Thought it might make up for it. A bit.'],
    ['isolde', 'It does. It did. Wren, you stupid, brave...'],
    ['wren', 'Tell Bram\'s mam I\'m sorry about the swearing.'],
    ['', 'She doesn\'t say anything else. Bram carries her down the stair himself, and nobody tries to help.'],
  ],
  stand_together: [
    ['', 'The last Hollow on the stair falls. Everyone is still standing. Just.'],
    ['aldric', 'A hundred years I waited for an order. I think I prefer company.'],
  ],
  aldric_holds: [
    ['', 'The stair groans. Below, the Hollow are pouring up the tower in a black tide.'],
    ['aldric', 'Go. All of you. This stair is narrow and I am already dead. It is the best ground I have ever been given.'],
    ['bram', 'Aldric...'],
    ['aldric', 'Tell the king, if you see him again, that his champion held.'],
    ['', 'He plants his shield and does not move. You hear him for a long time as you climb. Then you don\'t.'],
    ['', 'On the landing, where he stood, lies his candle sigil. It is still warm.'],
  ],
  tower_boss: [
    ['', 'At the top of the tower a tall figure in black iron turns from the window. Over the iron of his gauntlet he wears a ring: a candle in a circle.'],
    ['isolde', 'Master.'],
    ['', '"Isolde. You kept it burning. I knew you would. You were always my best."'],
    ['', '"Give it to me. He promised the hunger would stop. He promised I could sleep."'],
    ['isolde', 'You burned Ashby.'],
    ['', '"I burned a village to keep the world from what the ember will do to you. One day you will understand. Today you will hand it over."'],
    ['isolde', 'No.'],
    ['wren', 'Get behind me, Isolde.', 'has:wren'],
    ['', '"Then I am sorry, child."'],
  ],
  hale_redeemed: [
    ['', 'Isolde kneels beside the broken armour and presses the ember to the black iron over his heart.'],
    ['isolde', 'Master. Come back. Just for a moment. Come back.'],
    ['', 'The iron cracks. Inside is an old man, thin as paper, blinking at the light.'],
    ['', '"Isolde. Oh, my girl. What did I do?"'],
    ['', '"Listen. His name is Vael. The Hollow King. He was the first fire, once, and he went out. He wants the ember to light himself again, and if he does, every hearth in the north goes cold."'],
    ['', '"Don\'t take it to him. Don\'t let it take you. And forgive me, if you can. Don\'t, if you can\'t."'],
    ['', 'Magister Hale closes his eyes. This time he is only asleep, and then he is not even that.'],
    ['isolde', 'I forgive you. I think. Ask me again in a year.'],
    ['', 'The ember burns white. EMBER SURGE III: surge attacks now hit twice as hard.'],
  ],
  hale_ended: [
    ['', 'Isolde lifts the ember and lets it burn.'],
    ['isolde', 'You taught me fire is a responsibility. Here\'s mine.'],
    ['', 'When the light fades there is only empty armour, and a ring with a candle on it. Isolde puts the ring on and does not speak for a long time.'],
  ],
  warden_end_dark: [
    ['', 'Morvane falls. As the armour cracks, Isolde sees an old man\'s face inside, for a moment. Then the Hollow takes it back.'],
    ['', '"He comes, little ember. Vael comes. And you never even asked me why."'],
    ['isolde', 'I never had the chance.'],
    ['', 'There was more to know about Hale. Some pages of his journal were never found.'],
  ],
};

// Choices inside the story. Each option sets flags, may run an action and plays a scene after.
const CHOICES = {
  wren_choice: {
    lines: STORY5.millroad_out,
    prompt: 'What does Isolde decide?',
    choices: [
      { label: 'Forgive her. She came back and fought for us.', flags: { wren_forgiven: true }, scene: 'wren_forgiven' },
      { label: 'Send her away. Isolde can\'t look at her.', flags: { wren_banished: true }, act: 'banish_wren', scene: 'wren_banished' },
    ],
  },
  aldric_stair: {
    lines: [
      ['', 'Behind you the stair fills with Hollow. Ahead, the Warden\'s hall. There isn\'t time to fight both.'],
      ['aldric', 'Let me hold the stair. I have done my dying already. You have not.'],
    ],
    prompt: 'What do you do?',
    choices: [
      { label: 'Let Aldric hold the stair alone.', flags: { stair: 'aldric' }, act: 'aldric_holds', scene: 'aldric_holds' },
      { label: 'Stand together and fight them all.', act: 'stand_fight' },
    ],
  },
  hale_choice: {
    lines: [
      ['', 'Morvane falls to his knees. The black iron is cracking, and through the cracks there is a face. Old, frightened, human.'],
      ['isolde', 'You wrote it all down. Every day. You fought it for months. I read it.'],
    ],
    prompt: 'Isolde has read his journal. What does she do?',
    choices: [
      { label: 'Reach for the man inside.', flags: { ending: 'redeemed' }, act: 'surge3', scene: 'hale_redeemed' },
      { label: 'End it.', flags: { ending: 'ended' }, scene: 'hale_ended' },
    ],
  },
};

root.STORYX = { STORY5, CHOICES };
if (typeof module !== 'undefined' && module.exports) module.exports = root.STORYX;
})(this);
