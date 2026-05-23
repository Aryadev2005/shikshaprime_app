-- Clean up direct conversations that incorrectly have subject fields
-- This fixes the bug where direct messages show as broadcasts

UPDATE conversations 
SET subject = NULL 
WHERE type = 'direct' 
  AND subject IS NOT NULL 
  AND subject != ''
  AND id NOT IN (
    -- Keep conversations that are actually group broadcasts (have more than 2 participants)
    SELECT DISTINCT c.id 
    FROM conversations c
    INNER JOIN conversation_participants cp ON c.id = cp.conversation_id 
    WHERE c.type = 'direct' 
      AND cp.is_active = 1
    GROUP BY c.id
    HAVING COUNT(cp.id) > 2
  );

-- Show results
SELECT 
  'After cleanup:' as status,
  COUNT(*) as count,
  type,
  CASE WHEN subject IS NULL THEN 'NULL' ELSE 'HAS_SUBJECT' END as subject_status
FROM conversations 
WHERE type = 'direct'
GROUP BY type, subject_status;