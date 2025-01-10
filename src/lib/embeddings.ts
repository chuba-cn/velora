/* eslint-disable @typescript-eslint/no-unused-vars */
import { embed } from "ai";
import { google } from "@ai-sdk/google";


export async function getEmbeddings(text: string) {
  try {
    const {embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: text.replace(/\n/, " ")
    })

    console.log("Embedding generated: ", embedding.length)
    return embedding
  } catch (error) {
    console.error("Error generating embeddings from text", error);
    throw error;
  }
}
