"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth/auth-client";
import { createSlug } from "@/lib/create-slug";
import {
  type CreateOrganizationForm,
  createOrganizationSchema,
} from "@/schemas/organization/create-organization.schema";

/**
 * Interactive button and modal dialog for registering a new organization workspace.
 * Uses React Hook Form with Zod validation (`createOrganizationSchema`) to manage inputs,
 * automatically generates a URL-friendly slug from the workspace name, and persists the new
 * organization via Better Auth. Upon successful creation, the new organization is immediately
 * activated as the active workspace session.
 *
 * @returns Dialog trigger button and modal form for creating an organization
 * @author Maruf Bepary
 */
export function CreateOrganizationButton() {
  const [open, setOpen] = useState(false);
  const form = useForm<CreateOrganizationForm>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
    },
  });

  const { isSubmitting } = form.formState;

  /**
   * Submits organization creation payload to Better Auth and updates active workspace context.
   * Generates a slug from the submitted name, invokes `organization.create`, resets the form,
   * dismisses the dialog, and automatically sets the newly created organization as active.
   *
   * @param data - Validated form values containing the organization name
   * @author Maruf Bepary
   */
  async function handleCreateOrganization(data: CreateOrganizationForm) {
    const slug = createSlug(data.name);
    const res = await authClient.organization.create({
      name: data.name,
      slug,
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to create organization");
    } else {
      form.reset();
      setOpen(false);
      await authClient.organization.setActive({ organizationId: res.data.id });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Organization</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreateOrganization)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                <LoadingSwap isLoading={isSubmitting}>Create</LoadingSwap>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
