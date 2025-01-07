/* eslint-disable @typescript-eslint/no-unused-vars */
import { embed } from "ai";
import { cohere } from "@ai-sdk/cohere";


export async function getEmbeddings(text: string) {
  try {
    const {embedding } = await embed({
      model: cohere.embedding("embed-multilingual-v3.0"),
      value: text.replace(/\n/, " ")
    })

    console.log("Embedding generated: ", embedding, embedding.length)
    return embedding
  } catch (error) {
    console.error("Error generating embeddings from text", error);
    throw error;
  }
}
