"use client"

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

type TreeViewElement = {
  id: string
  name: string
  parentId?: string | null
  isSelectable?: boolean
  children?: TreeViewElement[]
}

type TreeContextProps = {
  selectedId: string | undefined
  expandedItems: string[] | undefined
  indicator: boolean
  handleExpand: (id: string) => void
  selectItem: (id: string) => void
  setExpandedItems?: React.Dispatch<React.SetStateAction<string[] | undefined>>
  openIcon?: React.ReactNode
  closeIcon?: React.ReactNode
  direction: "rtl" | "ltr"
}

const TreeContext = createContext<TreeContextProps | null>(null)

const useTree = () => {
  const context = useContext(TreeContext)
  if (!context) {
    throw new Error("useTree must be used within a TreeProvider")
  }
  return context
}

type Direction = "rtl" | "ltr" | undefined

type TreeViewProps = {
  initialSelectedId?: string
  indicator?: boolean
  elements?: TreeViewElement[]
  initialExpandedItems?: string[]
  openIcon?: React.ReactNode
  closeIcon?: React.ReactNode
  onSelectChange?: (id: string) => void
  onExpandChange?: (expandedItems: string[]) => void
} & React.HTMLAttributes<HTMLDivElement>

const Tree = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      className,
      elements,
      initialSelectedId,
      initialExpandedItems,
      children,
      indicator = true,
      openIcon,
      closeIcon,
      dir,
      onSelectChange,
      onExpandChange,
      ...props
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(
      initialSelectedId
    )
    const [expandedItems, setExpandedItems] = useState<string[] | undefined>(
      initialExpandedItems
    )

    const selectItem = useCallback((id: string) => {
      setSelectedId(id)
      onSelectChange?.(id)
    }, [onSelectChange])

    const handleExpand = useCallback((id: string) => {
      setExpandedItems((prev) => {
        const next = prev?.includes(id)
          ? prev.filter((item) => item !== id)
          : [...(prev ?? []), id]
        onExpandChange?.(next)
        return next
      })
    }, [onExpandChange])

    const expandSpecificTargetedElements = useCallback(
      (elements?: TreeViewElement[], selectId?: string) => {
        if (!elements || !selectId) return
        const findParent = (
          currentElement: TreeViewElement,
          currentPath: string[] = []
        ) => {
          const isSelectable = currentElement.isSelectable ?? true
          const newPath = [...currentPath, currentElement.id]
          if (currentElement.id === selectId) {
            if (isSelectable) {
              setExpandedItems((prev) => [...(prev ?? []), ...newPath])
            } else {
              if (newPath.includes(currentElement.id)) {
                newPath.pop()
                setExpandedItems((prev) => [...(prev ?? []), ...newPath])
              }
            }
            return
          }
          if (
            isSelectable &&
            currentElement.children &&
            currentElement.children.length > 0
          ) {
            currentElement.children.forEach((child) => {
              findParent(child, newPath)
            })
          }
        }
        elements.forEach((element) => {
          findParent(element)
        })
      },
      []
    )

    useEffect(() => {
      if (initialSelectedId) {
        expandSpecificTargetedElements(elements, initialSelectedId)
      }
    }, [initialSelectedId, elements])

    const direction = dir === "rtl" ? "rtl" : "ltr"

    return (
      <TreeContext.Provider
        value={{
          selectedId,
          expandedItems,
          handleExpand,
          selectItem,
          setExpandedItems,
          indicator,
          openIcon,
          closeIcon,
          direction,
        }}
      >
        <div className={cn("size-full", className)}>
          <ScrollArea
            ref={ref}
            className="relative h-full p-4"
            dir={dir as Direction}
          >
            <AccordionPrimitive.Root
              {...props}
              type="multiple"
              defaultValue={expandedItems}
              value={expandedItems}
              className="flex flex-col gap-1"
              onValueChange={(value) =>
                setExpandedItems((prev) => [...(prev ?? []), value[0]])
              }
              dir={dir as Direction}
            >
              {children}
            </AccordionPrimitive.Root>
          </ScrollArea>
        </div>
      </TreeContext.Provider>
    )
  }
)

Tree.displayName = "Tree"

const TreeIndicator = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { direction } = useTree()

  return (
    <div
      dir={direction}
      ref={ref}
      className={cn(
        "bg-muted absolute left-1.5 h-full w-px rounded-md py-3 duration-300 ease-in-out hover:bg-slate-300 rtl:right-1.5",
        className
      )}
      {...props}
    />
  )
})

TreeIndicator.displayName = "TreeIndicator"

type FolderProps = {
  expandedItems?: string[]
  element: string | React.ReactNode
  isSelectable?: boolean
  isSelect?: boolean
} & React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>

const Folder = forwardRef<
  HTMLDivElement,
  FolderProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      className,
      element,
      value,
      isSelectable = true,
      isSelect,
      children,
      ...props
    },
    ref
  ) => {
    const {
      direction,
      handleExpand,
      expandedItems,
      indicator,
      setExpandedItems,
      openIcon,
      closeIcon,
    } = useTree()

    return (
      <AccordionPrimitive.Item
        {...props}
        value={value}
        className="relative h-full overflow-hidden"
      >
        <AccordionPrimitive.Trigger
          asChild
          disabled={!isSelectable}
        >
          <div
            className={cn(
              `flex items-center gap-1 rounded-md text-sm w-full pr-1 duration-200 ease-in-out pl-2 py-0.5 outline-none focus-visible:ring-1 focus-visible:ring-ring`,
              className,
              {
                "bg-[var(--color-active)] rounded-md": isSelect && isSelectable,
                "cursor-pointer": isSelectable,
                "cursor-not-allowed opacity-50": !isSelectable,
              }
            )}
            onClick={() => handleExpand(value)}
          >
            {expandedItems?.includes(value)
              ? (openIcon ?? <FolderOpenIcon className="size-4 shrink-0" />)
              : (closeIcon ?? <FolderIcon className="size-4 shrink-0" />)}
            <div className="flex-1 overflow-hidden w-full text-left flex items-center">{element}</div>
          </div>
        </AccordionPrimitive.Trigger>
        <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down relative h-full overflow-hidden text-sm">
          {element && indicator && <TreeIndicator aria-hidden="true" />}
          <AccordionPrimitive.Root
            dir={direction}
            type="multiple"
            className="ml-2 flex flex-col gap-1  py-1 rtl:mr-2"
            defaultValue={expandedItems}
            value={expandedItems}
            onValueChange={(value) => {
              setExpandedItems?.((prev) => [...(prev ?? []), value[0]])
            }}
          >
            {children}
          </AccordionPrimitive.Root>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    )
  }
)

Folder.displayName = "Folder"

const File = forwardRef<
  HTMLDivElement,
  {
    value: string
    handleSelect?: (id: string) => void
    isSelectable?: boolean
    isSelect?: boolean
    fileIcon?: React.ReactNode
  } & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      value,
      className,
      handleSelect,
      isSelectable = true,
      isSelect,
      fileIcon,
      children,
      ...props
    },
    ref
  ) => {
    const { direction, selectedId, selectItem } = useTree()
    const isSelected = isSelect ?? selectedId === value
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={isSelectable ? 0 : -1}
        aria-disabled={!isSelectable}
        className={cn(
          "flex w-full items-center gap-1 rounded-md pr-1 text-sm duration-200 ease-in-out rtl:pr-0 rtl:pl-1 pl-2 py-0.5 justify-center outline-none focus-visible:ring-1 focus-visible:ring-ring",
          {
            "bg-[var(--color-active)]": isSelected && isSelectable,
          },
          isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          direction === "rtl" ? "rtl" : "ltr",
          className
        )}
        onClick={(e) => {
            selectItem(value);
            props.onClick?.(e);
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                selectItem(value);
            }
            props.onKeyDown?.(e);
        }}
        {...props}
      >
        {fileIcon ?? <FileIcon className="size-4" />}
        {children}
      </div>
    )
  }
)

File.displayName = "File"

const CollapseButton = forwardRef<
  HTMLButtonElement,
  {
    elements: TreeViewElement[]
    expandAll?: boolean
  } & React.HTMLAttributes<HTMLButtonElement>
>(({ className, elements, expandAll = false, children, ...props }, ref) => {
  const { expandedItems, setExpandedItems } = useTree()

  const expendAllTree = useCallback((elements: TreeViewElement[]) => {
    const expandTree = (element: TreeViewElement) => {
      const isSelectable = element.isSelectable ?? true
      if (isSelectable && element.children && element.children.length > 0) {
        setExpandedItems?.((prev) => [...(prev ?? []), element.id])
        element.children.forEach(expandTree)
      }
    }

    elements.forEach(expandTree)
  }, [])

  const closeAll = useCallback(() => {
    setExpandedItems?.([])
  }, [])

  useEffect(() => {
    console.log(expandAll)
    if (expandAll) {
      expendAllTree(elements)
    }
  }, [expandAll])

  return (
    <Button
      variant={"ghost"}
      className="absolute right-2 bottom-1 h-8 w-fit p-1"
      onClick={
        expandedItems && expandedItems.length > 0
          ? closeAll
          : () => expendAllTree(elements)
      }
      ref={ref}
      {...props}
    >
      {children}
      <span className="sr-only">Toggle</span>
    </Button>
  )
})

CollapseButton.displayName = "CollapseButton"

export { CollapseButton, File, Folder, Tree, type TreeViewElement }
