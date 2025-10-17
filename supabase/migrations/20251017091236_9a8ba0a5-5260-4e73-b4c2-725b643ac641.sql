-- Create role enum for RBAC system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (SEPARATE from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Add admin policies for content management (ready for future use)
CREATE POLICY "Admins can manage all lifehacks"
ON public.lifehacks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can approve user-submitted lifehacks"
ON public.lifehacks
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'moderator') AND 
  user_submitted = true
);

CREATE POLICY "Admins can manage challenges"
ON public.challenges
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chat messages"
ON public.chat_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage tips"
ON public.tips
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage exercises"
ON public.exercises
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage achievements"
ON public.achievements
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add policy for admins to manage user roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));