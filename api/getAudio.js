const blob = require('@vercel/blob');

// Configure blob with token
const blobConfig = {
  token: process.env.BLOB_READ_WRITE_TOKEN
};

module.exports = async (req, res) => {
  const word = req.query.word;
  const prompt = req.query.prompt;

  const apiKey = process.env.CARTESIA_API_KEY;
  const voiceId = "cca5ca6e-dabc-4559-b628-7b04ff10082f";
  const audioFileName = `${word}.wav`;

  console.log("Checking Blob for:", audioFileName);
  console.log("Blob config:", blobConfig);
  try {
    // Check if the file exists in Blob storage using head
    let existingBlob;
    try {
      existingBlob = await blob.head(audioFileName);
      console.log("Blob metadata:", existingBlob);
    } catch (error) {
      if (error instanceof blob.BlobNotFoundError) {
        console.log("File not found in Blob, will generate new audio.");
        existingBlob = null;
      } else {
        throw error;
      }
    }

    if (existingBlob) {
      // Use the URL directly from head
      const downloadUrl = existingBlob.url;
      console.log("Found in Blob, returning URL:", downloadUrl);
      return res.json({ audio: downloadUrl });
    }

    console.log("Not found in Blob, generating with Cartesia...");
    const cartesiaResponse = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model_id: "sonic-english",
        transcript: prompt,
        voice: {
          mode: "id",
          id: voiceId,
        },
        language: "en",
        output_format: {
          container: "wav",
          encoding: "pcm_f32le",
          sample_rate: 44100,
        },
      }),
    });

    if (!cartesiaResponse.ok) {
      console.log("Cartesia response status:", cartesiaResponse.status);
      throw new Error(`Cartesia API error: ${cartesiaResponse.statusText}`);
    }

    const audioBuffer = await cartesiaResponse.arrayBuffer();
    console.log("Audio generated, storing in Blob...");

    const blobResult = await blob.put(audioFileName, audioBuffer, {
      access: 'public',
      contentType: 'audio/wav',
      addRandomSuffix: false,
    });

    console.log("Stored in Blob, URL:", blobResult.url);
    res.json({ audio: blobResult.url });
  } catch (error) {
    console.error("Error handling audio:", error.message, error.stack);
    res.status(500).json({ error: "Failed to generate or store audio" });
  }
};