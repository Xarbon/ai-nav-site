export default {
  async scheduled(event, env, ctx) {
    console.log('Running scheduled news collection at', new Date().toISOString());
    
    try {
      // Call the news collection API
      const response = await fetch('https://aiqury.com/api/news/collect', {
        headers: {
          'User-Agent': 'AIqury-Cron-Bot/1.0'
        }
      });
      
      const result = await response.json();
      console.log('News collection result:', result);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Scheduled task failed:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
