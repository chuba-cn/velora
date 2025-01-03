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


const ComposeButton = () => {

  const [ toValues, setToValues ] = React.useState<{ label: string; value: string }[]>([]);
  const [ ccValues, setCcValues ] = React.useState<{ label: string; value: string }[]>([]);
  const [ subject, setSubject ] = React.useState<string>("");
  
  const handleSend = async (value: string) => {
    console.log("Sending email: ", value);
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