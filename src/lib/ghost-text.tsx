/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable react/display-name */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import React from "react";

export default (props: any) => {
  return (
    <NodeViewWrapper as="span">
      <NodeViewContent className="!inline select-none text-gray-300" as="span">
        {props.node.attrs.content}
      </NodeViewContent>
    </NodeViewWrapper>
  );
};
