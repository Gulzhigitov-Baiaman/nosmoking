-- Add validation constraints to chat_messages table for security
ALTER TABLE chat_messages 
ADD CONSTRAINT message_length_check 
CHECK (char_length(message) > 0 AND char_length(message) <= 2000);

-- Add validation constraints to private_messages table for consistency
ALTER TABLE private_messages 
ADD CONSTRAINT private_message_length_check 
CHECK (char_length(message) > 0 AND char_length(message) <= 2000);

-- Add validation constraints to lifehacks table
ALTER TABLE lifehacks 
ADD CONSTRAINT lifehack_title_length CHECK (char_length(title) BETWEEN 3 AND 200),
ADD CONSTRAINT lifehack_description_length CHECK (char_length(description) BETWEEN 10 AND 5000);