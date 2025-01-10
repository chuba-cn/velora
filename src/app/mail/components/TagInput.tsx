/* eslint-disable @typescript-eslint/ban-ts-comment */
import useThreads from '@/hooks/useThreads';
import { api } from '@/trpc/react';
import React from 'react';
import Avatar from 'react-avatar';
import Select from "react-select";

type TagInputProps = {
  placeholder: string,
  label: string,
  onChange: (values: { label: string, value: string }[]) => void,
  value: {label: string, value: string}[]
}

const TagInput = ({ label, onChange, placeholder, value }: TagInputProps) => {

  const [selectInputValue, setSelectInputValue] = React.useState<string>("");
  
  const { accountId } = useThreads();
  const { data: suggestions } = api.account.getSuggestions.useQuery({
    accountId
  });

  const options = suggestions?.map((suggestion) => ({
    label: (
      <span className='flex items-center gap-2'>
        <Avatar name={ suggestion.address } size='25' textSizeRatio={ 2 } round={true} />
        {suggestion.address}
      </span>
    ),
    value: suggestion.address
  }))

  return (
    <div className="flex items-center rounded-md border">
      <span className="ml-3 text-sm text-gray-500">{label}</span>
      <Select
        value={value}
        // @ts-expect-error
        onChange={onChange}
        placeholder={placeholder}
        isMulti
        // @ts-expect-error
        options={ selectInputValue ? options?.concat({
          label: (
            <span className='flex items-center gap-2'>
              <Avatar name={ selectInputValue } size='25' textSizeRatio={ 2 } round={ true } />
              {selectInputValue}
            </span>
          ),
          value: selectInputValue
        }) : options}
        className="w-full flex-1"
        classNames={{
          control: () => {
            return "!border-none !outline-none !ring-0 !shadow-none focus:border-none focus:outline-none focus:ring-0 focus:shadow-none dark:bg-transparent";
          },
          multiValue: () => {
            return "dark:!bg-gray-700";
          },
          multiValueLabel: () => {
            return "dark:text-white dark:bg-gray-700 rounded-md";
          },
          menu: () => {
            return "dark:!bg-gray-900 dark:text-zinc-500"
          },
        } }
        onInputChange={ setSelectInputValue }
        classNamePrefix="select"
      />
    </div>
  );
}

export default TagInput