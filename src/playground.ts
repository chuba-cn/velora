
/* eslint-disable @typescript-eslint/no-unused-vars */
import { create, insert, search, type AnyOrama} from "@orama/orama";
import { db } from "./server/db";

// Create orama db schema for emails search
const orama = create({
  schema: {
    subject: 'string',
    body: "string",
    rawBody: "string",
    from: "string",
    to: "string",
    sentAt: "string",
    threadId: "string",
    // embeddings: "vector[1536]"
  }
});

const emails = await db.email.findMany({
  select: {
    subject: true,
    body: true,
    from: true,
    to: true,
    sentAt: true,
    threadId: true,
  }
});

for (const email of emails) {
  console.log(email.subject)

  //Insert into our orama db using the created schema
  await insert(orama, {
    subject: email.subject,
    body: email.body ?? "",
    from: email.from.address,
    to: email.to.map(to => to.address).join(","),
    sentAt: email.sentAt.toLocaleString(),
    threadId: email.threadId
  })
}


// Searching the orama db with a search term
const searchResult = await search(orama, {
  term: "auth"
})


// Displaying the search results
for (const hit of searchResult.hits) {
  console.log(hit.document.subject)
}