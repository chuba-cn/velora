'use client'

import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import EmailEditor from './EmailEditor';
import { api } from '@/trpc/react';
import useThreads from '@/hooks/useThreads';
import { toast } from 'sonner';


const ComposeButton = () => {

  const [ toValues, setToValues ] = React.useState<{ label: string; value: string }[]>([]);
  const [ ccValues, setCcValues ] = React.useState<{ label: string; value: string }[]>([]);
  const [ subject, setSubject ] = React.useState<string>("");
  
  const sendEmail = api.account.sendEmail.useMutation();
  const { account } = useThreads();

  const handleSend = async (value: string) => {
    if (!account) return;
    
    sendEmail.mutate(
      {
        accountId: account.id,
        threadId: undefined,
        body: value,
        from: {
          name: account?.name ?? "Me",
          address: account?.emailAddress ?? "me@example.com",
        },
        to: toValues.map((to) => ({ name: to.value, address: to.value })),
        cc: ccValues.map((cc) => ({ name: cc.value, address: cc.value })),
        replyTo: {
          name: account?.name ?? "Me",
          address: account?.emailAddress ?? "me@example.com",
        },
        subject,
        inReplyTo: undefined,
      },
      {
        onSuccess: () => {
          toast.success("Email Sent!");
        },
        onError: () => {
          console.error("Error sending email");
          toast.error("Error sending email");
        },
      },
    );
  }

  return (
    <div>
      <Drawer>
        <DrawerTrigger asChild>
          <Button>
            <Pencil size={4} className='mr-1'/>
            Compose
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Compose Email</DrawerTitle>
          </DrawerHeader>
          <EmailEditor
            ccValues={ ccValues }
            setCcValues={ setCcValues }
            toValues={ toValues }
            setToValues={ setToValues }
            subject={ subject }
            setSubject={ setSubject }
            handleSend={ handleSend }
            isSending={ false }
            to={ toValues.map(v => v.value) }
            defualtToolbarExpanded={ true}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default ComposeButton