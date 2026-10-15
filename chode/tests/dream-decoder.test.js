/**
 * Dream Decoder — AI Sleep Story Generator
 * MVP Test Suite
 */

const assert = require('assert');

async function transcribeDream(audioData) {
  return { transcript: 'I was flying over a vast ocean with golden waves', confidence: 0.95 };
}

async function interpretDream(transcript) {
  return { symbols: ['flying', 'ocean'], theme: 'freedom', interpretation: 'You desire freedom' };
}

async function generateStory(dreamContext, userName) {
  return { storyId: 'story_' + Date.now(), title: 'The Ocean Weaver', protagonist: userName || 'Dreamer' };
}

async function generateAudioNarration(text) {
  return { audioId: 'audio_' + Date.now(), url: 'https://cdn.test.com/' + Date.now() + '.mp3' };
}

class DreamDecoder {
  constructor() {
    this.dreams = [];
    this.stories = [];
    this.users = {};
    this.pricing = { free: 1, premium: 9.99, onecourse: 2 };
  }

  async registerUser(userId, name) {
    this.users[userId] = { name, plan: 'free', storiesUsed: 0, storiesPerWeek: 1 };
    return this.users[userId];
  }

  async recordDream(userId, audioData) {
    const user = this.users[userId];
    if (!user) throw new Error('User not found');
    if (user.plan === 'free' && user.storiesUsed >= user.storiesPerWeek) {
      throw new Error('Free limit reached. Upgrade to premium.');
    }
    const transcription = await transcribeDream(audioData);
    const interpretation = await interpretDream(transcription.transcript);
    const dream = { dreamId: 'dream_' + Date.now(), userId, transcript: transcription.transcript, interpretation, timestamp: new Date().toISOString() };
    this.dreams.push(dream);
    return dream;
  }

  async generateStoryFromDream(dreamId, userName) {
    const dream = this.dreams.find(d => d.dreamId === dreamId);
    if (!dream) throw new Error('Dream not found');
    const story = await generateStory(dream.interpretation, userName || dream.userId);
    const audio = await generateAudioNarration(story.title);
    const completeStory = { ...story, audio, dreamId, createdAt: new Date().toISOString() };
    this.stories.push(completeStory);
    if (this.users[dream.userId]) this.users[dream.userId].storiesUsed++;
    return completeStory;
  }

  getWeeklyUsage(userId) {
    const user = this.users[userId];
    if (!user) return null;
    return { plan: user.plan, used: user.storiesUsed, limit: user.plan === 'premium' ? Infinity : user.storiesPerWeek };
  }

  getAnalytics() {
    return { totalDreams: this.dreams.length, totalStories: this.stories.length, totalUsers: Object.keys(this.users).length };
  }
}

async function runTests() {
  console.log('\n🌙 DREAM DECODER — Test Suite\n');
  console.log('═'.repeat(50));

  const decoder = new DreamDecoder();
  let passed = 0;
  let failed = 0;

  // Test 1: Register user
  try {
    const user = await decoder.registerUser('user_1', 'Alice');
    assert(user.name === 'Alice');
    assert(user.plan === 'free');
    console.log('✅ Test 1: Register user — PASS');
    passed++;
  } catch (e) {
    console.log('❌ Test 1: Register user — FAIL:', e.message);
    failed++;
  }

  // Test 2: Record dream
  let dreamId;
  try {
    const dream = await decoder.recordDream('user_1', 'audio_data_here');
    assert(dream.dreamId.startsWith('dream_'));
    assert(dream.transcript.includes('flying'));
    dreamId = dream.dreamId;
    console.log('✅ Test 2: Record dream — PASS');
    passed++;
  } catch (e) {
    console.log('❌ Test 2: Record dream — FAIL:', e.message);
    failed++;
  }

  // Test 3: Generate story
  try {
    const story = await decoder.generateStoryFromDream(dreamId, 'Alice');
    assert(story.storyId.startsWith('story_'));
    assert(story.protagonist === 'Alice');
    assert(story.audio.url.endsWith('.mp3'));
    console.log('✅ Test 3: Generate story — PASS');
    passed++;
  } catch (e) {
    console.log('❌ Test 3: Generate story — FAIL:', e.message);
    failed++;
  }

  // Test 4: Usage tracking
  try {
    const usage = decoder.getWeeklyUsage('user_1');
    assert(usage.used === 1);
    assert(usage.plan === 'free');
    console.log('✅ Test 4: Usage tracking — PASS');
    passed++;
  } catch (e) {
    console.log('❌ Test 4: Usage tracking — FAIL:', e.message);
    failed++;
  }

  // Test 5: Free limit enforcement
  try {
    decoder.users['user_1'].storiesPerWeek = 1;
    decoder.users['user_1'].storiesUsed = 1;
    await decoder.recordDream('user_1', 'another_dream');
    console.log('❌ Test 5: Free limit — FAIL (should have thrown)');
    failed++;
  } catch (e) {
    assert(e.message.includes('limit') || e.message.includes('Upgrade'));
    console.log('✅ Test 5: Free limit — PASS');
    passed++;
  }

  // Test 6: Analytics
  try {
    const analytics = decoder.getAnalytics();
    assert(analytics.totalDreams === 1);
    assert(analytics.totalStories === 1);
    console.log('✅ Test 6: Analytics — PASS');
    passed++;
  } catch (e) {
    console.log('❌ Test 6: Analytics — FAIL:', e.message);
    failed++;
  }

  // Test 7: Error handling
  try {
    await decoder.generateStoryFromDream('nonexistent');
    console.log('❌ Test 7: Error handling — FAIL (should have thrown)');
    failed++;
  } catch (e) {
    assert(e.message.includes('not found'));
    console.log('✅ Test 7: Error handling — PASS');
    passed++;
  }

  console.log('═'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return failed === 0;
}

runTests().then(success => process.exit(success ? 0 : 1));
